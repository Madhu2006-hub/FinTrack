package com.fintrack.service;

import com.fintrack.dto.DashboardSummary;
import com.fintrack.dto.TransactionResponse;
import com.fintrack.entity.TransactionType;
import com.fintrack.mapper.AggregationMapper;
import com.fintrack.mapper.DtoMapper;
import com.fintrack.repository.TransactionRepository;
import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardService {

    private static final int RECENT_LIMIT = 5;

    private final TransactionRepository transactionRepository;
    private final BudgetService budgetService;

    public DashboardService(TransactionRepository transactionRepository, BudgetService budgetService) {
        this.transactionRepository = transactionRepository;
        this.budgetService = budgetService;
    }

    /**
     * Totals and category breakdown cover the selected month only.
     * Recent transactions are the user's latest five across all months, so the list stays useful
     * even when the selected month is empty.
     */
    @Transactional(readOnly = true)
    public DashboardSummary summary(Long userId, YearMonth month) {
        var from = month.atDay(1);
        var to = month.atEndOfMonth();

        BigDecimal income = transactionRepository.sumByTypeBetween(userId, TransactionType.INCOME, from, to);
        BigDecimal expenses = transactionRepository.sumByTypeBetween(userId, TransactionType.EXPENSE, from, to);
        List<TransactionResponse> recent = transactionRepository
                .findTop5ByUserIdOrderByTransactionDateDescIdDesc(userId).stream()
                .limit(RECENT_LIMIT)
                .map(DtoMapper::toTransactionResponse)
                .toList();

        return new DashboardSummary(
                month.toString(),
                income,
                expenses,
                income.subtract(expenses),
                AggregationMapper.toSortedTotals(
                        transactionRepository.sumByCategoryBetween(userId, TransactionType.EXPENSE, from, to)),
                recent,
                budgetService.listForMonth(userId, month));
    }
}
