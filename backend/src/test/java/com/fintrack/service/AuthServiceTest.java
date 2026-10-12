package com.fintrack.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.fintrack.config.AppProperties;
import com.fintrack.dto.AuthResponse;
import com.fintrack.dto.LoginRequest;
import com.fintrack.dto.RegisterRequest;
import com.fintrack.entity.User;
import com.fintrack.exception.ConflictException;
import com.fintrack.exception.InvalidCredentialsException;
import com.fintrack.repository.UserRepository;
import com.fintrack.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private JwtService jwtService;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(new AppProperties(
                new AppProperties.Jwt("unit-test-secret-key-that-is-long-enough-32", 60),
                new AppProperties.Cors("http://localhost:5173")));
        authService = new AuthService(userRepository, encoder, jwtService);
    }

    @Test
    void registerHashesPasswordAndNormalizesEmail() {
        when(userRepository.existsByEmail("ana@example.com")).thenReturn(false);
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        AuthResponse response = authService.register(new RegisterRequest("  Ana ", "  Ana@Example.com ", "password123"));

        var captor = org.mockito.ArgumentCaptor.forClass(User.class);
        verify(userRepository).saveAndFlush(captor.capture());
        User saved = captor.getValue();
        assertThat(saved.getEmail()).isEqualTo("ana@example.com");
        assertThat(saved.getName()).isEqualTo("Ana");
        assertThat(saved.getPasswordHash()).isNotEqualTo("password123");
        assertThat(encoder.matches("password123", saved.getPasswordHash())).isTrue();
        assertThat(response.token()).isNotBlank();
        assertThat(response.user().email()).isEqualTo("ana@example.com");
    }

    @Test
    void registerRejectsDuplicateEmail() {
        when(userRepository.existsByEmail("ana@example.com")).thenReturn(true);
        assertThatThrownBy(() -> authService.register(new RegisterRequest("Ana", "ana@example.com", "password123")))
                .isInstanceOf(ConflictException.class);
        verify(userRepository, never()).saveAndFlush(any());
    }

    @Test
    void loginSucceedsWithCorrectPassword() {
        User user = new User("Ana", "ana@example.com", encoder.encode("password123"));
        when(userRepository.findByEmail("ana@example.com")).thenReturn(java.util.Optional.of(user));

        AuthResponse response = authService.login(new LoginRequest("ana@example.com", "password123"));

        assertThat(response.token()).isNotBlank();
        assertThat(response.user().email()).isEqualTo("ana@example.com");
    }

    @Test
    void loginRejectsWrongPasswordWithGenericMessage() {
        User user = new User("Ana", "ana@example.com", encoder.encode("password123"));
        when(userRepository.findByEmail("ana@example.com")).thenReturn(java.util.Optional.of(user));
        assertThatThrownBy(() -> authService.login(new LoginRequest("ana@example.com", "wrong-password")))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessage("Invalid email or password.");
    }

    @Test
    void loginRejectsUnknownEmailWithSameGenericMessage() {
        when(userRepository.findByEmail("nobody@example.com")).thenReturn(java.util.Optional.empty());
        assertThatThrownBy(() -> authService.login(new LoginRequest("nobody@example.com", "password123")))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessage("Invalid email or password.");
    }
}
