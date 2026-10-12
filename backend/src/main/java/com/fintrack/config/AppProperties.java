package com.fintrack.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Typed application settings. Validation runs at startup, so a missing or weak
 * JWT secret stops the application with a clear message instead of failing later.
 */
@Validated
@ConfigurationProperties(prefix = "app")
public record AppProperties(@NotNull @Valid Jwt jwt, @NotNull @Valid Cors cors) {

    public record Jwt(
            @NotBlank(message = "JWT_SECRET must be set. Use a value of at least 32 characters.")
            @Size(min = 32, message = "JWT_SECRET must be at least 32 characters long.")
            String secret,
            @Min(value = 1, message = "JWT_EXPIRATION_MINUTES must be at least 1.")
            long expirationMinutes
    ) {
    }

    public record Cors(@NotBlank String allowedOrigin) {
    }
}
