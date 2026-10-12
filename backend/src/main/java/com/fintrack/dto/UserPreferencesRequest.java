package com.fintrack.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserPreferencesRequest(
        @Size(max = 2, message = "Country code must be at most 2 characters.")
        String countryCode,

        @NotBlank(message = "Currency code is required.")
        @Size(min = 3, max = 3, message = "Currency code must be a 3-letter ISO 4217 code.")
        String currencyCode
) {
}
