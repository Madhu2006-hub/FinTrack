package com.fintrack.repository;

import com.fintrack.entity.Budget;
import com.fintrack.entity.Category;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BudgetRepository extends JpaRepository<Budget, Long> {

    Optional<Budget> findByIdAndUserId(Long id, Long userId);

    List<Budget> findByUserIdAndBudgetMonthOrderByCategoryAsc(Long userId, LocalDate budgetMonth);

    boolean existsByUserIdAndCategoryAndBudgetMonth(Long userId, Category category, LocalDate budgetMonth);
}
