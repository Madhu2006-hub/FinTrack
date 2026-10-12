package com.fintrack.controller;

import com.fintrack.dto.SavingsGoalAmountRequest;
import com.fintrack.dto.SavingsGoalRequest;
import com.fintrack.dto.SavingsGoalResponse;
import com.fintrack.service.SavingsGoalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/savings-goals")
@Tag(name = "Savings Goals", description = "Management of user savings goals")
public class SavingsGoalController {

    private final SavingsGoalService goalService;

    public SavingsGoalController(SavingsGoalService goalService) {
        this.goalService = goalService;
    }

    @GetMapping
    @Operation(summary = "Get all savings goals for the authenticated user")
    public List<SavingsGoalResponse> getGoals(@AuthenticationPrincipal Long userId) {
        return goalService.getGoals(userId);
    }

    @PostMapping
    @Operation(summary = "Create a new savings goal")
    public ResponseEntity<SavingsGoalResponse> createGoal(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody SavingsGoalRequest request
    ) {
        SavingsGoalResponse created = goalService.createGoal(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing savings goal")
    public SavingsGoalResponse updateGoal(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id,
            @Valid @RequestBody SavingsGoalRequest request
    ) {
        return goalService.updateGoal(userId, id, request);
    }

    @PostMapping("/{id}/deposit")
    @Operation(summary = "Contribute / deposit towards a savings goal")
    public SavingsGoalResponse deposit(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id,
            @Valid @RequestBody SavingsGoalAmountRequest request
    ) {
        return goalService.deposit(userId, id, request.amount());
    }

    @PostMapping("/{id}/withdraw")
    @Operation(summary = "Withdraw funds from a savings goal")
    public SavingsGoalResponse withdraw(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id,
            @Valid @RequestBody SavingsGoalAmountRequest request
    ) {
        return goalService.withdraw(userId, id, request.amount());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete a savings goal")
    public void deleteGoal(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id
    ) {
        goalService.deleteGoal(userId, id);
    }
}
