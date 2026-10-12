package com.fintrack.dto;

public record UserResponse(Long id, String name, String email, String countryCode, String currencyCode) {
}
