package com.fintrack.dto;

import com.fintrack.entity.Category;
import java.math.BigDecimal;

public record CategoryTotal(Category category, BigDecimal amount) {
}
