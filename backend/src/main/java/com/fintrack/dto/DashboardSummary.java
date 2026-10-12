package com.fintrack.dto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardSummary(
        String month,
        BigDecimal totalIncome,
        BigDecimal totalExpenses,
        BigDecimal netSavings,
        List<CategoryTotal> expenseByCategory,
        List<TransactionResponse> recentTransactions,
        List<BudgetResponse> budgets
) {
}
