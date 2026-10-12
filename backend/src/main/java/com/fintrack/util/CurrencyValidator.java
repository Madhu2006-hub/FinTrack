package com.fintrack.util;

import java.util.Currency;
import java.util.Locale;

/**
 * Validates ISO 4217 currency codes using the standard Java runtime currency database.
 */
public final class CurrencyValidator {

    private CurrencyValidator() {
    }

    public static boolean isValid(String code) {
        if (code == null) {
            return false;
        }
        String trimmed = code.trim().toUpperCase(Locale.ROOT);
        if (trimmed.length() != 3) {
            return false;
        }
        try {
            Currency currency = Currency.getInstance(trimmed);
            return currency != null;
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }
}
