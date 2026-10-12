package com.fintrack.exception;

/** Thrown when a record does not exist or does not belong to the authenticated user. */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
