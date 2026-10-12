package com.fintrack.dto;

import com.fintrack.entity.Category;
import com.fintrack.entity.TransactionType;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionRequest(
        @NotBlank(message = "Title is required.") @Size(max = 120, message = "Title must be at most 120 characters.") String title,
        @NotNull(message = "Amount is required.")
        @DecimalMin(value = "0.01", message = "Amount must be greater than zero.")
        @Digits(integer = 13, fraction = 2, message = "Amount may have at most 2 decimal places.") BigDecimal amount,
        @NotNull(message = "Type is required (INCOME or EXPENSE).") TransactionType type,
        @NotNull(message = "Category is required.") Category category,
        @NotNull(message = "Date is required.") LocalDate transactionDate,
        @Size(max = 500, message = "Description must be at most 500 characters.") String description
) {
}
