package com.fintrack.service;

import com.fintrack.dto.PageResponse;
import com.fintrack.dto.TransactionRequest;
import com.fintrack.dto.TransactionResponse;
import com.fintrack.entity.Category;
import com.fintrack.entity.Transaction;
import com.fintrack.entity.TransactionType;
import com.fintrack.entity.User;
import com.fintrack.exception.BadRequestException;
import com.fintrack.exception.ResourceNotFoundException;
import com.fintrack.mapper.DtoMapper;
import com.fintrack.repository.TransactionRepository;
import com.fintrack.repository.UserRepository;
import java.time.LocalDate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TransactionService {

    static final int MAX_PAGE_SIZE = 100;

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public TransactionService(TransactionRepository transactionRepository, UserRepository userRepository) {
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public TransactionResponse create(Long userId, TransactionRequest request) {
        validateTypeMatchesCategory(request.type(), request.category());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found."));
        Transaction saved = transactionRepository.save(new Transaction(
                user, request.title().trim(), request.amount(), request.type(),
                request.category(), request.transactionDate(), normalizeDescription(request.description())));
        return DtoMapper.toTransactionResponse(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<TransactionResponse> search(Long userId, TransactionType type, Category category,
                                                    LocalDate from, LocalDate to, String search,
                                                    int page, int size, String sortBy, String direction) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new BadRequestException("The 'from' date must be on or before the 'to' date.");
        }
        if (page < 0 || size < 1) {
            throw new BadRequestException("Page must be zero or greater and size must be at least 1.");
        }
        Sort sort = buildSort(sortBy, direction);
        Page<Transaction> result = transactionRepository.search(
                userId, type, category, from, to, blankToNull(search),
                PageRequest.of(page, Math.min(size, MAX_PAGE_SIZE), sort));
        return new PageResponse<>(
                result.map(DtoMapper::toTransactionResponse).getContent(),
                result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages());
    }

    @Transactional(readOnly = true)
    public TransactionResponse get(Long userId, Long id) {
        return DtoMapper.toTransactionResponse(findOwned(userId, id));
    }

    @Transactional
    public TransactionResponse update(Long userId, Long id, TransactionRequest request) {
        validateTypeMatchesCategory(request.type(), request.category());
        Transaction transaction = findOwned(userId, id);
        transaction.update(request.title().trim(), request.amount(), request.type(), request.category(),
                request.transactionDate(), normalizeDescription(request.description()));
        return DtoMapper.toTransactionResponse(transaction);
    }

    @Transactional
    public void delete(Long userId, Long id) {
        transactionRepository.delete(findOwned(userId, id));
    }

    /** Ownership is enforced by querying with both ID and user ID. Another user's ID returns not-found. */
    private Transaction findOwned(Long userId, Long id) {
        return transactionRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction " + id + " was not found."));
    }

    static void validateTypeMatchesCategory(TransactionType type, Category category) {
        if (category.getTransactionType() != type) {
            throw new BadRequestException("Category " + category + " cannot be used for " + type + " transactions.");
        }
    }

    private Sort buildSort(String sortBy, String direction) {
        String property = switch (sortBy == null ? "date" : sortBy.toLowerCase()) {
            case "date" -> "transactionDate";
            case "amount" -> "amount";
            case "title" -> "title";
            default -> throw new BadRequestException("sortBy must be one of: date, amount, title.");
        };
        Sort.Direction dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(dir, property).and(Sort.by(Sort.Direction.DESC, "id"));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static String normalizeDescription(String description) {
        return blankToNull(description);
    }
}
