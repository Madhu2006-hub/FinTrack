package com.fintrack.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Name is required.") @Size(max = 100, message = "Name must be at most 100 characters.") String name,
        @NotBlank(message = "Email is required.") @Email(message = "Enter a valid email address.") @Size(max = 255) String email,
        @NotBlank(message = "Password is required.")
        @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters.") String password,
        @Size(max = 2, message = "Country code must be at most 2 characters.") String countryCode,
        @Size(max = 3, message = "Currency code must be at most 3 characters.") String currencyCode
) {
    public RegisterRequest(String name, String email, String password) {
        this(name, email, password, null, "USD");
    }
}
