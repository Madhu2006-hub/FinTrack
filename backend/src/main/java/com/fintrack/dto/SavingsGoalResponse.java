package com.fintrack.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record SavingsGoalResponse(
        Long id,
        String name,
        BigDecimal targetAmount,
        BigDecimal currentAmount,
        BigDecimal remainingAmount,
        BigDecimal percentSaved,
        LocalDate targetDate,
        String notes,
        boolean completed,
        Instant createdAt,
        Instant updatedAt
) {
}
