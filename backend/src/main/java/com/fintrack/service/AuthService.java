package com.fintrack.service;

import com.fintrack.dto.AuthResponse;
import com.fintrack.dto.LoginRequest;
import com.fintrack.dto.RegisterRequest;
import com.fintrack.dto.UserResponse;
import com.fintrack.entity.User;
import com.fintrack.exception.ConflictException;
import com.fintrack.exception.InvalidCredentialsException;
import com.fintrack.exception.ResourceNotFoundException;
import com.fintrack.mapper.DtoMapper;
import com.fintrack.repository.UserRepository;
import com.fintrack.security.JwtService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("An account with this email already exists.");
        }
        User user = new User(request.name().trim(), email, passwordEncoder.encode(request.password()),
                request.countryCode(), request.currencyCode());
        try {
            user = userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException ex) {
            // Covers the race where two registrations with the same email arrive together.
            throw new ConflictException("An account with this email already exists.");
        }
        return buildAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(normalizeEmail(request.email()))
                .orElseThrow(InvalidCredentialsException::new);
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }
        return buildAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public UserResponse currentUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found."));
        return DtoMapper.toUserResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(token, "Bearer", jwtService.getExpirationSeconds(), DtoMapper.toUserResponse(user));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }
}
