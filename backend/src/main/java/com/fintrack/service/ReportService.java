package com.fintrack.service;

import com.fintrack.dto.MonthSummary;
import com.fintrack.dto.ReportSummary;
import com.fintrack.entity.TransactionType;
import com.fintrack.exception.BadRequestException;
import com.fintrack.mapper.AggregationMapper;
import com.fintrack.repository.TransactionRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportService {

    static final int MAX_MONTHS = 24;

    private final TransactionRepository transactionRepository;

    public ReportService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    @Transactional(readOnly = true)
    public ReportSummary summary(Long userId, YearMonth from, YearMonth to) {
        if (from.isAfter(to)) {
            throw new BadRequestException("'from' must be on or before 'to'.");
        }
        long months = ChronoUnit.MONTHS.between(from, to) + 1;
        if (months > MAX_MONTHS) {
            throw new BadRequestException("A report can cover at most " + MAX_MONTHS + " months.");
        }

        LocalDate fromDate = from.atDay(1);
        LocalDate toDate = to.atEndOfMonth();

        Map<YearMonth, Map<TransactionType, BigDecimal>> monthlyTotals = AggregationMapper.toMonthlyTypeMap(
                transactionRepository.sumByMonthAndTypeBetween(userId, fromDate, toDate));

        List<MonthSummary> monthly = new ArrayList<>();
        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpenses = BigDecimal.ZERO;
        BigDecimal previousExpenses = null;

        for (YearMonth m = from; !m.isAfter(to); m = m.plusMonths(1)) {
            Map<TransactionType, BigDecimal> byType = monthlyTotals.get(m);
            BigDecimal income = byType != null ? byType.getOrDefault(TransactionType.INCOME, BigDecimal.ZERO) : BigDecimal.ZERO;
            BigDecimal expenses = byType != null ? byType.getOrDefault(TransactionType.EXPENSE, BigDecimal.ZERO) : BigDecimal.ZERO;

            monthly.add(new MonthSummary(
                    m.toString(), income, expenses, income.subtract(expenses),
                    changePercent(previousExpenses, expenses)));
            totalIncome = totalIncome.add(income);
            totalExpenses = totalExpenses.add(expenses);
            previousExpenses = expenses;
        }

        return new ReportSummary(
                from.toString(), to.toString(), totalIncome, totalExpenses,
                totalIncome.subtract(totalExpenses), monthly,
                AggregationMapper.toSortedTotals(transactionRepository.sumByCategoryBetween(
                        userId, TransactionType.EXPENSE, fromDate, toDate)));
    }

    static BigDecimal changePercent(BigDecimal previous, BigDecimal current) {
        if (previous == null || previous.signum() == 0) {
            return null;
        }
        return current.subtract(previous).multiply(new BigDecimal("100"))
                .divide(previous, 1, RoundingMode.HALF_UP);
    }
}
