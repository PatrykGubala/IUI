package com.example.demo.auth.jwt;

import com.example.demo.auth.user.UserRepository;
import com.example.demo.model.User;
import io.jsonwebtoken.JwtException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Date;

@Service
public class TokenBlacklistService {
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final ServerStartupManager serverStartupManager;
    private final Logger logger = LoggerFactory.getLogger(TokenBlacklistService.class);
    private final BlacklistedTokenRepository blacklistedTokenRepository;

    public TokenBlacklistService(BlacklistedTokenRepository blacklistedTokenRepository,
                                 JwtTokenProvider jwtTokenProvider,
                                 UserRepository userRepository,
                                 ServerStartupManager serverStartupManager) {
        this.blacklistedTokenRepository = blacklistedTokenRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
        this.serverStartupManager = serverStartupManager;
    }

    public boolean isTokenBlacklisted(String token) {
        return blacklistedTokenRepository.existsByToken(token);
    }

    public boolean isTokenIssuedBeforeServerStart(String token) {
        try {
            Date issuedAt = jwtTokenProvider.getIssuedAtFromToken(token);
            return issuedAt != null && issuedAt.before(serverStartupManager.getServerStartupTime());
        } catch (Exception e) {
            logger.error("Error checking token issue time: {}", e.getMessage());
            return true;
        }
    }

    public void blacklistToken(String token, String username) {
        if (!isTokenBlacklisted(token)) {
            try {
                Date expiryDate = jwtTokenProvider.getExpirationDateFromToken(token);
                User user = userRepository.findByEmail(username)
                        .orElse(null);

                BlacklistedToken blacklistedToken = new BlacklistedToken();
                blacklistedToken.setToken(token);
                blacklistedToken.setExpiryDate(expiryDate);
                blacklistedToken.setBlacklistedAt(new java.util.Date());
                blacklistedToken.setUser(user);

                blacklistedTokenRepository.save(blacklistedToken);
                logger.info("Token blacklisted for user: {} with expiry: {}", username, expiryDate);

            } catch (JwtException e) {
                logger.error("Could not extract expiry date from token during blacklisting: {}", e.getMessage());
            }
        }
    }
}
