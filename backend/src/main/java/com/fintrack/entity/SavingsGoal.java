package com.fintrack.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "savings_goals")
public class SavingsGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(name = "target_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal targetAmount;

    @Column(name = "current_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal currentAmount;

    @Column(name = "target_date")
    private LocalDate targetDate;

    @Column(length = 500)
    private String notes;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected SavingsGoal() {
    }

    public SavingsGoal(User user, String name, BigDecimal targetAmount, BigDecimal currentAmount, LocalDate targetDate, String notes) {
        this.user = user;
        this.name = name;
        this.targetAmount = targetAmount;
        this.currentAmount = currentAmount != null ? currentAmount : BigDecimal.ZERO;
        this.targetDate = targetDate;
        this.notes = notes;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public void update(String name, BigDecimal targetAmount, LocalDate targetDate, String notes) {
        this.name = name;
        this.targetAmount = targetAmount;
        this.targetDate = targetDate;
        this.notes = notes;
        this.updatedAt = Instant.now();
    }

    public void deposit(BigDecimal amount) {
        this.currentAmount = this.currentAmount.add(amount);
        this.updatedAt = Instant.now();
    }

    public void withdraw(BigDecimal amount) {
        this.currentAmount = this.currentAmount.subtract(amount);
        if (this.currentAmount.compareTo(BigDecimal.ZERO) < 0) {
            this.currentAmount = BigDecimal.ZERO;
        }
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public String getName() { return name; }
    public BigDecimal getTargetAmount() { return targetAmount; }
    public BigDecimal getCurrentAmount() { return currentAmount; }
    public LocalDate getTargetDate() { return targetDate; }
    public String getNotes() { return notes; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
