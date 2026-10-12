package com.fintrack.controller;

import com.fintrack.dto.BudgetAmountUpdateRequest;
import com.fintrack.dto.BudgetRequest;
import com.fintrack.dto.BudgetResponse;
import com.fintrack.service.BudgetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.YearMonth;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/budgets")
@Tag(name = "Budgets", description = "Monthly category budgets with spending progress")
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    @GetMapping
    @Operation(summary = "List budgets for a month (yyyy-MM), defaulting to the current month")
    public List<BudgetResponse> list(@AuthenticationPrincipal Long userId,
                                     @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth month) {
        return budgetService.listForMonth(userId, month != null ? month : YearMonth.now());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a monthly budget for an expense category")
    public BudgetResponse create(@AuthenticationPrincipal Long userId, @Valid @RequestBody BudgetRequest request) {
        return budgetService.create(userId, request);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Change the amount of one of your budgets")
    public BudgetResponse updateAmount(@AuthenticationPrincipal Long userId, @PathVariable Long id,
                                       @Valid @RequestBody BudgetAmountUpdateRequest request) {
        return budgetService.updateAmount(userId, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete one of your budgets")
    public void delete(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        budgetService.delete(userId, id);
    }
}
