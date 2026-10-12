package com.fintrack.controller;

import com.fintrack.dto.PageResponse;
import com.fintrack.dto.TransactionRequest;
import com.fintrack.dto.TransactionResponse;
import com.fintrack.entity.Category;
import com.fintrack.entity.TransactionType;
import com.fintrack.service.TransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transactions")
@Tag(name = "Transactions", description = "Income and expense records for the authenticated user")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping
    @Operation(summary = "Search and page through transactions")
    public PageResponse<TransactionResponse> search(
            @AuthenticationPrincipal Long userId,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) Category category,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "date") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        return transactionService.search(userId, type, category, from, to, search, page, size, sortBy, direction);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create an income or expense transaction")
    public TransactionResponse create(@AuthenticationPrincipal Long userId, @Valid @RequestBody TransactionRequest request) {
        return transactionService.create(userId, request);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get one of your transactions")
    public TransactionResponse get(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        return transactionService.get(userId, id);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update one of your transactions")
    public TransactionResponse update(@AuthenticationPrincipal Long userId, @PathVariable Long id,
                                      @Valid @RequestBody TransactionRequest request) {
        return transactionService.update(userId, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete one of your transactions")
    public void delete(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        transactionService.delete(userId, id);
    }
}
