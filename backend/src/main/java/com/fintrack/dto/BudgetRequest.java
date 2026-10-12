package com.fintrack.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fintrack.entity.Category;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.YearMonth;

public record BudgetRequest(
        @NotNull(message = "Category is required.") Category category,
        @NotNull(message = "Month is required (format yyyy-MM).")
        @JsonFormat(pattern = "yyyy-MM") YearMonth month,
        @NotNull(message = "Budget amount is required.")
        @DecimalMin(value = "0.01", message = "Budget amount must be greater than zero.")
        @Digits(integer = 13, fraction = 2, message = "Budget amount may have at most 2 decimal places.") BigDecimal amount
) {
}
