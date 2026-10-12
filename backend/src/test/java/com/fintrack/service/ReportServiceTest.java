package com.fintrack.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.fintrack.dto.ReportSummary;
import com.fintrack.entity.Category;
import com.fintrack.entity.TransactionType;
import com.fintrack.exception.BadRequestException;
import com.fintrack.repository.TransactionRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    private ReportService reportService;

    @BeforeEach
    void setUp() {
        reportService = new ReportService(transactionRepository);
    }

    @Test
    void changePercentIsNullWithoutPreviousMonth() {
        assertThat(ReportService.changePercent(null, new BigDecimal("100"))).isNull();
    }

    @Test
    void changePercentIsNullWhenPreviousMonthHadNoExpenses() {
        assertThat(ReportService.changePercent(BigDecimal.ZERO, new BigDecimal("100"))).isNull();
    }

    @Test
    void changePercentShowsIncreaseAndDecrease() {
        assertThat(ReportService.changePercent(new BigDecimal("200"), new BigDecimal("250"))).isEqualByComparingTo("25.0");
        assertThat(ReportService.changePercent(new BigDecimal("200"), new BigDecimal("150"))).isEqualByComparingTo("-25.0");
    }

    @Test
    void summaryAggregatesMultipleMonthsWithSingleGroupedQuery() {
        Long userId = 1L;
        YearMonth from = YearMonth.of(2026, 1);
        YearMonth to = YearMonth.of(2026, 3);
        LocalDate fromDate = from.atDay(1);
        LocalDate toDate = to.atEndOfMonth();

        // 2026-01: Income 1000, Expense 400
        // 2026-02: Income 0, Expense 500 (+25% expense change)
        // 2026-03: Income 1200, Expense 250 (-50% expense change)
        List<Object[]> monthlyRows = List.of(
                new Object[]{2026, 1, TransactionType.INCOME, new BigDecimal("1000.00")},
                new Object[]{2026, 1, TransactionType.EXPENSE, new BigDecimal("400.00")},
                new Object[]{2026, 2, TransactionType.EXPENSE, new BigDecimal("500.00")},
                new Object[]{2026, 3, TransactionType.INCOME, new BigDecimal("1200.00")},
                new Object[]{2026, 3, TransactionType.EXPENSE, new BigDecimal("250.00")}
        );
        List<Object[]> categoryRows = List.of(
                new Object[]{Category.FOOD, new BigDecimal("700.00")},
                new Object[]{Category.BILLS, new BigDecimal("450.00")}
        );

        when(transactionRepository.sumByMonthAndTypeBetween(eq(userId), eq(fromDate), eq(toDate)))
                .thenReturn(monthlyRows);
        when(transactionRepository.sumByCategoryBetween(eq(userId), eq(TransactionType.EXPENSE), eq(fromDate), eq(toDate)))
                .thenReturn(categoryRows);

        ReportSummary summary = reportService.summary(userId, from, to);

        // Verify exactly one call each (no N+1 loops)
        verify(transactionRepository, times(1)).sumByMonthAndTypeBetween(userId, fromDate, toDate);
        verify(transactionRepository, times(1)).sumByCategoryBetween(userId, TransactionType.EXPENSE, fromDate, toDate);
        verifyNoMoreInteractions(transactionRepository);

        assertThat(summary.from()).isEqualTo("2026-01");
        assertThat(summary.to()).isEqualTo("2026-03");
        assertThat(summary.totalIncome()).isEqualByComparingTo("2200.00");
        assertThat(summary.totalExpenses()).isEqualByComparingTo("1150.00");
        assertThat(summary.netSavings()).isEqualByComparingTo("1050.00");

        assertThat(summary.months()).hasSize(3);
        // Month 1
        assertThat(summary.months().get(0).month()).isEqualTo("2026-01");
        assertThat(summary.months().get(0).income()).isEqualByComparingTo("1000.00");
        assertThat(summary.months().get(0).expenses()).isEqualByComparingTo("400.00");
        assertThat(summary.months().get(0).net()).isEqualByComparingTo("600.00");
        assertThat(summary.months().get(0).expenseChangePercent()).isNull();

        // Month 2 (had no income in data -> defaults to 0)
        assertThat(summary.months().get(1).month()).isEqualTo("2026-02");
        assertThat(summary.months().get(1).income()).isEqualByComparingTo("0.00");
        assertThat(summary.months().get(1).expenses()).isEqualByComparingTo("500.00");
        assertThat(summary.months().get(1).net()).isEqualByComparingTo("-500.00");
        assertThat(summary.months().get(1).expenseChangePercent()).isEqualByComparingTo("25.0");

        // Month 3
        assertThat(summary.months().get(2).month()).isEqualTo("2026-03");
        assertThat(summary.months().get(2).income()).isEqualByComparingTo("1200.00");
        assertThat(summary.months().get(2).expenses()).isEqualByComparingTo("250.00");
        assertThat(summary.months().get(2).net()).isEqualByComparingTo("950.00");
        assertThat(summary.months().get(2).expenseChangePercent()).isEqualByComparingTo("-50.0");

        // Category totals
        assertThat(summary.expenseByCategory()).hasSize(2);
        assertThat(summary.expenseByCategory().get(0).category()).isEqualTo(Category.FOOD);
        assertThat(summary.expenseByCategory().get(0).amount()).isEqualByComparingTo("700.00");
    }

    @Test
    void summaryHandlesEmptyMonthsCorrectly() {
        Long userId = 1L;
        YearMonth from = YearMonth.of(2026, 4);
        YearMonth to = YearMonth.of(2026, 6);
        LocalDate fromDate = from.atDay(1);
        LocalDate toDate = to.atEndOfMonth();

        when(transactionRepository.sumByMonthAndTypeBetween(eq(userId), eq(fromDate), eq(toDate)))
                .thenReturn(List.of());
        when(transactionRepository.sumByCategoryBetween(eq(userId), eq(TransactionType.EXPENSE), eq(fromDate), eq(toDate)))
                .thenReturn(List.of());

        ReportSummary summary = reportService.summary(userId, from, to);

        assertThat(summary.totalIncome()).isEqualByComparingTo("0.00");
        assertThat(summary.totalExpenses()).isEqualByComparingTo("0.00");
        assertThat(summary.netSavings()).isEqualByComparingTo("0.00");
        assertThat(summary.months()).hasSize(3);

        for (int i = 0; i < 3; i++) {
            assertThat(summary.months().get(i).income()).isEqualByComparingTo("0.00");
            assertThat(summary.months().get(i).expenses()).isEqualByComparingTo("0.00");
            assertThat(summary.months().get(i).net()).isEqualByComparingTo("0.00");
            assertThat(summary.months().get(i).expenseChangePercent()).isNull();
        }
    }

    @Test
    void summaryRejectsInvalidRanges() {
        assertThatThrownBy(() -> reportService.summary(1L, YearMonth.of(2026, 5), YearMonth.of(2026, 4)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("'from' must be on or before 'to'");

        assertThatThrownBy(() -> reportService.summary(1L, YearMonth.of(2024, 1), YearMonth.of(2026, 2)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("at most 24 months");
    }
}
