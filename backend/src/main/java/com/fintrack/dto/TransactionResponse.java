package com.fintrack.dto;

import com.fintrack.entity.Category;
import com.fintrack.entity.TransactionType;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record TransactionResponse(
        Long id,
        String title,
        BigDecimal amount,
        TransactionType type,
        Category category,
        LocalDate transactionDate,
        String description,
        Instant createdAt,
        Instant updatedAt
) {
}
