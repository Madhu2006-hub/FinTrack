package com.fintrack.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record SavingsGoalRequest(
        @NotBlank(message = "Goal name is required.")
        @Size(max = 120, message = "Goal name must not exceed 120 characters.")
        String name,

        @NotNull(message = "Target amount is required.")
        @DecimalMin(value = "0.01", message = "Target amount must be at least 0.01.")
        BigDecimal targetAmount,

        @DecimalMin(value = "0.00", message = "Current amount cannot be negative.")
        BigDecimal currentAmount,

        LocalDate targetDate,

        @Size(max = 500, message = "Notes must not exceed 500 characters.")
        String notes
) {
}
