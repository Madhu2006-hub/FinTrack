package com.fintrack.dto;

import com.fintrack.entity.Category;
import java.math.BigDecimal;

/**
 * spent is computed from the user's EXPENSE transactions in the category for the budget month.
 * status is OK below 80% usage, WARNING from 80% up to 100%, and EXCEEDED above 100%.
 */
public record BudgetResponse(
        Long id,
        Category category,
        String month,
        BigDecimal budgetAmount,
        BigDecimal spent,
        BigDecimal remaining,
        BigDecimal percentUsed,
        String status
) {
}
