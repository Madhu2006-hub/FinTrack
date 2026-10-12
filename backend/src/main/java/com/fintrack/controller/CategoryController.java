package com.fintrack.controller;

import com.fintrack.dto.CategoryResponse;
import com.fintrack.entity.Category;
import com.fintrack.entity.TransactionType;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Arrays;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/categories")
@Tag(name = "Categories", description = "Supported income and expense categories")
public class CategoryController {

    @GetMapping
    @Operation(summary = "List categories, optionally filtered by INCOME or EXPENSE")
    public List<CategoryResponse> list(@RequestParam(required = false) TransactionType type) {
        return Arrays.stream(Category.values())
                .filter(c -> type == null || c.getTransactionType() == type)
                .map(c -> new CategoryResponse(c.name(), label(c), c.getTransactionType().name()))
                .toList();
    }

    private static String label(Category category) {
        String words = category.name().toLowerCase().replace('_', ' ');
        return Character.toUpperCase(words.charAt(0)) + words.substring(1);
    }
}
