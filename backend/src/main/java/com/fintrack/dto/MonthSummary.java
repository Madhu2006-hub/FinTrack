package com.fintrack.dto;

import java.math.BigDecimal;

/**
 * expenseChangePercent compares this month's expenses with the previous month in the range.
 * It is null for the first month in the range or when the previous month had zero expenses.
 */
public record MonthSummary(
        String month,
        BigDecimal income,
        BigDecimal expenses,
        BigDecimal net,
        BigDecimal expenseChangePercent
) {
}
