package com.fintrack.service;

import com.fintrack.dto.BudgetAmountUpdateRequest;
import com.fintrack.dto.BudgetRequest;
import com.fintrack.dto.BudgetResponse;
import com.fintrack.entity.Budget;
import com.fintrack.entity.Category;
import com.fintrack.entity.TransactionType;
import com.fintrack.entity.User;
import com.fintrack.exception.BadRequestException;
import com.fintrack.exception.ConflictException;
import com.fintrack.exception.ResourceNotFoundException;
import com.fintrack.mapper.AggregationMapper;
import com.fintrack.repository.BudgetRepository;
import com.fintrack.repository.TransactionRepository;
import com.fintrack.repository.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Budget period rule: a budget applies to one calendar month (first day to last day, inclusive).
 * Spent = sum of the user's EXPENSE transactions in that category whose transaction_date falls in the month.
 */
@Service
public class BudgetService {

    static final BigDecimal WARNING_THRESHOLD_PERCENT = new BigDecimal("80");
    static final BigDecimal HUNDRED = new BigDecimal("100");

    private final BudgetRepository budgetRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public BudgetService(BudgetRepository budgetRepository, TransactionRepository transactionRepository,
                         UserRepository userRepository) {
        this.budgetRepository = budgetRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public BudgetResponse create(Long userId, BudgetRequest request) {
        requireExpenseCategory(request.category());
        if (budgetRepository.existsByUserIdAndCategoryAndBudgetMonth(
                userId, request.category(), request.month().atDay(1))) {
            throw new ConflictException("A budget for " + request.category() + " already exists for " + request.month() + ".");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found."));
        Budget budget;
        try {
            budget = budgetRepository.saveAndFlush(
                    new Budget(user, request.category(), request.month().atDay(1), request.amount()));
        } catch (DataIntegrityViolationException ex) {
            throw new ConflictException("A budget for " + request.category() + " already exists for " + request.month() + ".");
        }
        BigDecimal spent = spentFor(userId, request.category(), request.month());
        return toResponse(budget, spent);
    }

    @Transactional(readOnly = true)
    public List<BudgetResponse> listForMonth(Long userId, YearMonth month) {
        List<Budget> budgets = budgetRepository.findByUserIdAndBudgetMonthOrderByCategoryAsc(userId, month.atDay(1));
        Map<Category, BigDecimal> spentByCategory = AggregationMapper.toCategoryMap(
                transactionRepository.sumByCategoryBetween(userId, TransactionType.EXPENSE,
                        month.atDay(1), month.atEndOfMonth()));
        return budgets.stream()
                .map(b -> toResponse(b, spentByCategory.getOrDefault(b.getCategory(), BigDecimal.ZERO)))
                .toList();
    }

    @Transactional
    public BudgetResponse updateAmount(Long userId, Long id, BudgetAmountUpdateRequest request) {
        Budget budget = findOwned(userId, id);
        budget.changeAmount(request.amount());
        YearMonth month = YearMonth.from(budget.getBudgetMonth());
        return toResponse(budget, spentFor(userId, budget.getCategory(), month));
    }

    @Transactional
    public void delete(Long userId, Long id) {
        budgetRepository.delete(findOwned(userId, id));
    }

    private Budget findOwned(Long userId, Long id) {
        return budgetRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Budget " + id + " was not found."));
    }

    private BigDecimal spentFor(Long userId, Category category, YearMonth month) {
        return transactionRepository.sumByCategoryBetween(userId, TransactionType.EXPENSE,
                        month.atDay(1), month.atEndOfMonth()).stream()
                .filter(row -> row[0] == category)
                .map(row -> (BigDecimal) row[1])
                .findFirst()
                .orElse(BigDecimal.ZERO);
    }

    private void requireExpenseCategory(Category category) {
        if (category.getTransactionType() != TransactionType.EXPENSE) {
            throw new BadRequestException("Budgets can only be created for expense categories.");
        }
    }

    static BudgetResponse toResponse(Budget budget, BigDecimal spent) {
        BigDecimal amount = budget.getAmount();
        BigDecimal remaining = amount.subtract(spent);
        BigDecimal percent = spent.multiply(HUNDRED).divide(amount, 1, RoundingMode.HALF_UP);
        String status;
        if (spent.compareTo(amount) > 0) {
            status = "EXCEEDED";
        } else if (spent.multiply(HUNDRED).compareTo(WARNING_THRESHOLD_PERCENT.multiply(amount)) >= 0) {
            status = "WARNING";
        } else {
            status = "OK";
        }
        return new BudgetResponse(budget.getId(), budget.getCategory(),
                YearMonth.from(budget.getBudgetMonth()).toString(),
                amount, spent, remaining, percent, status);
    }
}
