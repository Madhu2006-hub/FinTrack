package com.fintrack.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.fintrack.dto.BudgetResponse;
import com.fintrack.entity.Budget;
import com.fintrack.entity.Category;
import com.fintrack.entity.User;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class BudgetServiceTest {

    private BudgetResponse respond(String budget, String spent) {
        User user = new User("Ana", "ana@example.com", "hash");
        Budget b = new Budget(user, Category.FOOD, LocalDate.of(2026, 10, 15), new BigDecimal(budget));
        return BudgetService.toResponse(b, new BigDecimal(spent));
    }

    @Test
    void budgetPeriodIsNormalizedToFirstDayOfMonth() {
        User user = new User("Ana", "ana@example.com", "hash");
        Budget b = new Budget(user, Category.FOOD, LocalDate.of(2026, 10, 15), BigDecimal.TEN);
        assertThat(b.getBudgetMonth()).isEqualTo(LocalDate.of(2026, 10, 1));
    }

    @Test
    void statusIsOkBelowEightyPercent() {
        BudgetResponse r = respond("1000.00", "799.99");
        assertThat(r.status()).isEqualTo("OK");
        assertThat(r.remaining()).isEqualByComparingTo("200.01");
    }

    @Test
    void statusIsWarningAtEightyPercent() {
        BudgetResponse r = respond("1000.00", "800.00");
        assertThat(r.status()).isEqualTo("WARNING");
        assertThat(r.percentUsed()).isEqualByComparingTo("80.0");
    }

    @Test
    void statusIsWarningAtExactlyFullBudget() {
        BudgetResponse r = respond("500.00", "500.00");
        assertThat(r.status()).isEqualTo("WARNING");
        assertThat(r.remaining()).isEqualByComparingTo("0.00");
    }

    @Test
    void statusIsExceededAboveBudgetWithNegativeRemaining() {
        BudgetResponse r = respond("500.00", "650.50");
        assertThat(r.status()).isEqualTo("EXCEEDED");
        assertThat(r.remaining()).isEqualByComparingTo("-150.50");
        assertThat(r.percentUsed()).isEqualByComparingTo("130.1");
    }
}
