package com.fintrack.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Column(name = "country_code", length = 2)
    private String countryCode;

    @Column(name = "currency_code", nullable = false, length = 3)
    private String currencyCode;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected User() {
    }

    public User(String name, String email, String passwordHash, String countryCode, String currencyCode) {
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
        this.countryCode = countryCode;
        this.currencyCode = (currencyCode != null && !currencyCode.isBlank()) ? currencyCode : "USD";
        this.createdAt = Instant.now();
    }

    public User(String name, String email, String passwordHash) {
        this(name, email, passwordHash, null, "USD");
    }

    public void updatePreferences(String countryCode, String currencyCode) {
        this.countryCode = countryCode;
        if (currencyCode != null && !currencyCode.isBlank()) {
            this.currencyCode = currencyCode;
        }
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public String getCountryCode() { return countryCode; }
    public String getCurrencyCode() { return currencyCode; }
    public Instant getCreatedAt() { return createdAt; }
}
