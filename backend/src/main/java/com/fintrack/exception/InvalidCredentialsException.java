package com.fintrack.exception;

/** Deliberately vague: the same message covers unknown email and wrong password. */
public class InvalidCredentialsException extends RuntimeException {
    public InvalidCredentialsException() {
        super("Invalid email or password.");
    }
}
