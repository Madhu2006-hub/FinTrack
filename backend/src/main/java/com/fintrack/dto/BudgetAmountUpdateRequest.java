package com.fintrack.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record BudgetAmountUpdateRequest(
        @NotNull(message = "Budget amount is required.")
        @DecimalMin(value = "0.01", message = "Budget amount must be greater than zero.")
        @Digits(integer = 13, fraction = 2, message = "Budget amount may have at most 2 decimal places.") BigDecimal amount
) {
}
