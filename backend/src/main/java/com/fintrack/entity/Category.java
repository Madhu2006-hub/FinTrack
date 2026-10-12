package com.fintrack.entity;

import java.util.Arrays;
import java.util.List;

/**
 * Fixed set of categories. Each category belongs to exactly one transaction type,
 * so the backend can reject, for example, a "Salary" expense.
 */
public enum Category {
    SALARY(TransactionType.INCOME),
    FREELANCE(TransactionType.INCOME),
    INVESTMENT(TransactionType.INCOME),
    OTHER_INCOME(TransactionType.INCOME),
    FOOD(TransactionType.EXPENSE),
    TRANSPORT(TransactionType.EXPENSE),
    SHOPPING(TransactionType.EXPENSE),
    BILLS(TransactionType.EXPENSE),
    HEALTHCARE(TransactionType.EXPENSE),
    ENTERTAINMENT(TransactionType.EXPENSE),
    OTHER_EXPENSE(TransactionType.EXPENSE);

    private final TransactionType transactionType;

    Category(TransactionType transactionType) {
        this.transactionType = transactionType;
    }

    public TransactionType getTransactionType() {
        return transactionType;
    }

    public static List<Category> forType(TransactionType type) {
        return Arrays.stream(values())
                .filter(c -> c.transactionType == type)
                .toList();
    }
}
