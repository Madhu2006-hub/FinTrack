package com.fintrack.service;

import com.fintrack.dto.SavingsGoalRequest;
import com.fintrack.dto.SavingsGoalResponse;
import com.fintrack.entity.SavingsGoal;
import com.fintrack.entity.User;
import com.fintrack.exception.ResourceNotFoundException;
import com.fintrack.repository.SavingsGoalRepository;
import com.fintrack.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@Transactional
public class SavingsGoalService {

    private static final BigDecimal HUNDRED = new BigDecimal("100");

    private final SavingsGoalRepository goalRepository;
    private final UserRepository userRepository;

    public SavingsGoalService(SavingsGoalRepository goalRepository, UserRepository userRepository) {
        this.goalRepository = goalRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<SavingsGoalResponse> getGoals(Long userId) {
        return goalRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public SavingsGoalResponse createGoal(Long userId, SavingsGoalRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        BigDecimal initialCurrent = request.currentAmount() != null ? request.currentAmount() : BigDecimal.ZERO;
        SavingsGoal goal = new SavingsGoal(
                user,
                request.name().trim(),
                request.targetAmount(),
                initialCurrent,
                request.targetDate(),
                request.notes() != null ? request.notes().trim() : null
        );
        goal = goalRepository.save(goal);
        return toResponse(goal);
    }

    public SavingsGoalResponse updateGoal(Long userId, Long goalId, SavingsGoalRequest request) {
        SavingsGoal goal = findUserGoal(userId, goalId);
        goal.update(
                request.name().trim(),
                request.targetAmount(),
                request.targetDate(),
                request.notes() != null ? request.notes().trim() : null
        );
        if (request.currentAmount() != null) {
            goal.deposit(request.currentAmount().subtract(goal.getCurrentAmount()));
        }
        goal = goalRepository.save(goal);
        return toResponse(goal);
    }

    public SavingsGoalResponse deposit(Long userId, Long goalId, BigDecimal amount) {
        SavingsGoal goal = findUserGoal(userId, goalId);
        goal.deposit(amount);
        goal = goalRepository.save(goal);
        return toResponse(goal);
    }

    public SavingsGoalResponse withdraw(Long userId, Long goalId, BigDecimal amount) {
        SavingsGoal goal = findUserGoal(userId, goalId);
        goal.withdraw(amount);
        goal = goalRepository.save(goal);
        return toResponse(goal);
    }

    public void deleteGoal(Long userId, Long goalId) {
        SavingsGoal goal = findUserGoal(userId, goalId);
        goalRepository.delete(goal);
    }

    private SavingsGoal findUserGoal(Long userId, Long goalId) {
        return goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Savings goal not found."));
    }

    private SavingsGoalResponse toResponse(SavingsGoal goal) {
        BigDecimal target = goal.getTargetAmount();
        BigDecimal current = goal.getCurrentAmount();
        BigDecimal remaining = target.subtract(current);
        if (remaining.compareTo(BigDecimal.ZERO) < 0) {
            remaining = BigDecimal.ZERO;
        }

        BigDecimal percent = BigDecimal.ZERO;
        if (target.compareTo(BigDecimal.ZERO) > 0) {
            percent = current.multiply(HUNDRED).divide(target, 1, RoundingMode.HALF_UP);
        }

        boolean completed = current.compareTo(target) >= 0;

        return new SavingsGoalResponse(
                goal.getId(),
                goal.getName(),
                target,
                current,
                remaining,
                percent,
                goal.getTargetDate(),
                goal.getNotes(),
                completed,
                goal.getCreatedAt(),
                goal.getUpdatedAt()
        );
    }
}
