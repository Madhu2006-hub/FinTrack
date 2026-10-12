package com.fintrack.dto;

import java.math.BigDecimal;
import java.util.List;

public record ReportSummary(
        String from,
        String to,
        BigDecimal totalIncome,
        BigDecimal totalExpenses,
        BigDecimal netSavings,
        List<MonthSummary> months,
        List<CategoryTotal> expenseByCategory
) {
}
