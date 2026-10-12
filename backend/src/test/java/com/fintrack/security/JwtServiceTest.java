package com.fintrack.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fintrack.config.AppProperties;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import org.junit.jupiter.api.Test;

class JwtServiceTest {

    private static final String SECRET = "unit-test-secret-key-that-is-long-enough-32";

    private JwtService serviceWith(String secret, long minutes) {
        return new JwtService(new AppProperties(new AppProperties.Jwt(secret, minutes),
                new AppProperties.Cors("http://localhost:5173")));
    }

    @Test
    void generatedTokenCarriesUserIdAsSubject() {
        JwtService service = serviceWith(SECRET, 60);
        String token = service.generateToken(42L, "a@example.com");
        assertThat(service.extractUserId(token)).isEqualTo(42L);
    }

    @Test
    void tokenSignedWithDifferentSecretIsRejected() {
        String foreign = Jwts.builder().subject("1")
                .expiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(Keys.hmacShaKeyFor("another-secret-that-is-also-32-characters".getBytes(StandardCharsets.UTF_8)))
                .compact();
        assertThatThrownBy(() -> serviceWith(SECRET, 60).extractUserId(foreign))
                .isInstanceOf(JwtException.class);
    }

    @Test
    void expiredTokenIsRejected() {
        JwtService service = serviceWith(SECRET, 60);
        String expired = Jwts.builder().subject("1")
                .expiration(new Date(System.currentTimeMillis() - 60_000))
                .signWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8)))
                .compact();
        assertThatThrownBy(() -> service.extractUserId(expired)).isInstanceOf(JwtException.class);
    }
}
