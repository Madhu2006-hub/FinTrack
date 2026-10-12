package com.fintrack.mapper;

import com.fintrack.dto.TransactionResponse;
import com.fintrack.dto.UserResponse;
import com.fintrack.entity.Transaction;
import com.fintrack.entity.User;

/** Converts entities to response DTOs so JPA entities and password hashes never leave the service layer. */
public final class DtoMapper {

    private DtoMapper() {
    }

    public static UserResponse toUserResponse(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail(),
                user.getCountryCode(), user.getCurrencyCode());
    }

    public static TransactionResponse toTransactionResponse(Transaction t) {
        return new TransactionResponse(
                t.getId(), t.getTitle(), t.getAmount(), t.getType(), t.getCategory(),
                t.getTransactionDate(), t.getDescription(), t.getCreatedAt(), t.getUpdatedAt());
    }
}
