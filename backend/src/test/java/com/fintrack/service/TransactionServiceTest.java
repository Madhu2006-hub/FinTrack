package com.fintrack.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.fintrack.dto.TransactionRequest;
import com.fintrack.entity.Category;
import com.fintrack.entity.TransactionType;
import com.fintrack.exception.BadRequestException;
import com.fintrack.exception.ResourceNotFoundException;
import com.fintrack.repository.TransactionRepository;
import com.fintrack.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;
    @Mock
    private UserRepository userRepository;
    @InjectMocks
    private TransactionService transactionService;

    private TransactionRequest request(TransactionType type, Category category) {
        return new TransactionRequest("Groceries", new BigDecimal("25.50"), type, category,
                LocalDate.of(2026, 10, 3), "weekly shop");
    }

    @Test
    void rejectsCategoryThatDoesNotMatchType() {
        assertThatThrownBy(() -> transactionService.create(1L, request(TransactionType.INCOME, Category.FOOD)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("cannot be used for INCOME");
        verify(transactionRepository, never()).save(any());
    }

    @Test
    void updateOfAnotherUsersTransactionIsNotFound() {
        when(transactionRepository.findByIdAndUserId(99L, 1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> transactionService.update(1L, 99L, request(TransactionType.EXPENSE, Category.FOOD)))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(transactionRepository, never()).delete(any());
    }

    @Test
    void deleteOfAnotherUsersTransactionIsNotFound() {
        when(transactionRepository.findByIdAndUserId(99L, 2L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> transactionService.delete(2L, 99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void searchRejectsInvertedDateRange() {
        assertThatThrownBy(() -> transactionService.search(1L, null, null,
                LocalDate.of(2026, 10, 10), LocalDate.of(2026, 10, 1), null, 0, 10, "date", "desc"))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void searchRejectsUnknownSortField() {
        assertThatThrownBy(() -> transactionService.search(1L, null, null, null, null, null, 0, 10, "password", "asc"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("sortBy");
    }
}
