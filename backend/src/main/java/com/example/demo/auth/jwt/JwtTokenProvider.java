package com.example.demo.auth.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.*;

@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private Long expiration;

    @Value("${jwt.refresh-token.expiration}")
    private Long refreshExpiration;

    public String generateAccessToken(UserDetails userDetails) {
        Date now = new Date();
        return Jwts.builder()
                .subject(userDetails.getUsername())
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expiration))
                .claim("nonce", UUID.randomUUID().toString())
                .claim("roles", userDetails.getAuthorities().stream()
                        .map(authority -> authority.getAuthority())
                        .toList())
                .signWith(getSigningKey())
                .compact();
    }

    public String generateRefreshToken(UserDetails userDetails) {
        Date now = new Date();
        return Jwts.builder()
                .subject(userDetails.getUsername())
                .issuedAt(now)
                .expiration(new Date(now.getTime() + refreshExpiration))
                .claim("tokenType", "refresh")
                .claim("nonce", UUID.randomUUID().toString())
                .signWith(getSigningKey())
                .compact();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private JwtParser getParser(){
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build();
    }

    private Claims extractClaims(String token){
        return getParser()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String getEmailFromToken(String token) {
        return extractClaims(token).getSubject();
    }

    public Date getExpirationDateFromToken(String token) {
        return extractClaims(token).getExpiration();
    }

    public Date getIssuedAtFromToken(String token) {
        return extractClaims(token).getIssuedAt();
    }

    public List<String> getRolesFromToken(String token){
        try {
            Claims claims = extractClaims(token);
            return claims.get("roles", List.class);
        } catch (Exception e) {
            return Collections.emptyList();
            }
    }

    public boolean validateToken(String token, UserDetails userDetails) {
        try {
            final String username = getEmailFromToken(token);
            if (userDetails == null) {
                return !isTokenExpired(token);
            }
            return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public boolean isTokenExpired(String token) {
        try {
            return extractClaims(token).getExpiration().before(new Date());
        } catch (JwtException | IllegalArgumentException e) {
            return true;
        }
    }

    public boolean isRefreshToken(String token) {
        try {
            Claims claims = extractClaims(token);
            return claims.get("tokenType").equals("refresh");
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
