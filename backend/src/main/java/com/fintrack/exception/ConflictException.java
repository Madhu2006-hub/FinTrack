package com.fintrack.exception;

/** Thrown when a request would create a duplicate (for example, a repeated email or budget). */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
