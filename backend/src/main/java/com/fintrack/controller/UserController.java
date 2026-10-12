package com.fintrack.controller;

import com.fintrack.dto.UserPreferencesRequest;
import com.fintrack.dto.UserResponse;
import com.fintrack.entity.User;
import com.fintrack.exception.ResourceNotFoundException;
import com.fintrack.mapper.DtoMapper;
import com.fintrack.repository.UserRepository;
import com.fintrack.util.CurrencyValidator;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/user")
@Tag(name = "User", description = "User profile and preferences")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PutMapping("/preferences")
    @Transactional
    @Operation(summary = "Update the authenticated user's country and currency preferences")
    public UserResponse updatePreferences(@AuthenticationPrincipal Long userId,
                                          @Valid @RequestBody UserPreferencesRequest request) {
        if (!CurrencyValidator.isValid(request.currencyCode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid ISO 4217 currency code: " + request.currencyCode());
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found."));
        user.updatePreferences(request.countryCode(), request.currencyCode());
        user = userRepository.save(user);
        return DtoMapper.toUserResponse(user);
    }
}
