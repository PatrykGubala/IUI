package com.example.demo.auth;

import com.example.demo.auth.jwt.JwtTokenProvider;
import com.example.demo.auth.jwt.TokenBlacklistService;
import com.example.demo.auth.user.*;

import com.example.demo.exception.EmailAlreadyExistsException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.exception.TokenRefreshException;
import com.example.demo.exception.UsernameAlreadyExistsException;
import com.example.demo.model.Role;
import com.example.demo.model.RoleName;
import com.example.demo.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuthServiceImpl implements AuthService {
    private static final Logger logger = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsServiceImpl userDetailsService;
    private final TokenBlacklistService tokenBlacklistService;

    public AuthServiceImpl(UserRepository userRepository,
                           RoleRepository roleRepository,
                           PasswordEncoder passwordEncoder,
                           JwtTokenProvider jwtTokenProvider,
                           AuthenticationManager authenticationManager,
                           UserDetailsServiceImpl userDetailsService,
                           TokenBlacklistService tokenBlacklistService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.tokenBlacklistService = tokenBlacklistService;
    }

    public UserDto register(RegisterRequest registerRequest) {
        logger.info("Registering user with email: {}", registerRequest.getEmail());

        if (Boolean.TRUE.equals(userRepository.existsByUsername(registerRequest.getUsername()))) {
            throw new UsernameAlreadyExistsException(registerRequest.getUsername());
        }

        if (Boolean.TRUE.equals(userRepository.existsByEmail(registerRequest.getEmail()))) {
            throw new EmailAlreadyExistsException(registerRequest.getEmail());
        }

        User user = new User();
        user.setUsername(registerRequest.getUsername());
        user.setEmail(registerRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        Set<Role> roles = new HashSet<>();

        if (registerRequest.getRoles() != null && !registerRequest.getRoles().isEmpty()) {
            registerRequest.getRoles().forEach(roleName -> {
                try {
                    RoleName enumRole = RoleName.valueOf(roleName.toUpperCase());
                    Role role = roleRepository.findByName(enumRole)
                            .orElseThrow(() -> new ResourceNotFoundException("Role", "name", enumRole));
                    roles.add(role);
                } catch (IllegalArgumentException e) {
                    logger.warn("Invalid role name: {}", roleName);
                }
            });
        }

        if (roles.isEmpty()) {
            Role userRole = roleRepository.findByName(RoleName.CLIENT)
                    .orElseThrow(() -> new ResourceNotFoundException("Role", "name", RoleName.CLIENT));
            roles.add(userRole);
        }

        User savedUser = userRepository.save(user);
        logger.info("User registered successfully with ID: {}", savedUser.getId());

        Set<String> userRoles = savedUser.getRoles().stream()
                .map(role -> role.getName().toString())
                .collect(Collectors.toSet());

        return new UserDto(savedUser.getId(),savedUser.getUsername(), savedUser.getEmail(), userRoles);
    }

    public Map<String, String> login(LoginRequest loginRequest) {
        logger.info("Attempting login for email: {}", loginRequest.getEmail());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String accessToken = jwtTokenProvider.generateAccessToken(userDetails);
        String refreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

        logger.info("Login successful for email: {}", loginRequest.getEmail());

        Map<String, String> tokens = new HashMap<>();
        tokens.put("accessToken", accessToken);
        tokens.put("refreshToken", refreshToken);

        return tokens;
    }

    public Map<String, String> refreshToken(String refreshToken) {
        logger.info("Processing refresh token request");

        if (tokenBlacklistService.isTokenBlacklisted(refreshToken)) {
            throw new TokenRefreshException(refreshToken, "Refresh token is blacklisted");
        }

        if (tokenBlacklistService.isTokenIssuedBeforeServerStart(refreshToken)) {
            throw new TokenRefreshException(refreshToken, "Refresh token was issued before server startup");
        }

        if (!jwtTokenProvider.isRefreshToken(refreshToken)) {
            throw new TokenRefreshException(refreshToken, "Invalid refresh token");
        }

        try {
            String email = jwtTokenProvider.getEmailFromToken(refreshToken);

            UserDetails userDetails = userDetailsService.loadUserByUsername(email);
            if (!jwtTokenProvider.validateToken(refreshToken, userDetails)) {
                throw new TokenRefreshException(refreshToken, "Invalid or expired refresh token");
            }

            tokenBlacklistService.blacklistToken(refreshToken, email);

            String newAccessToken = jwtTokenProvider.generateAccessToken(userDetails);
            String newRefreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

            logger.info("Tokens refreshed for user: {}", email);

            Map<String, String> tokens = new HashMap<>();
            tokens.put("accessToken", newAccessToken);
            tokens.put("refreshToken", newRefreshToken);

            return tokens;
        } catch (Exception e) {
            if (e instanceof TokenRefreshException) {
                throw e;
            }
            throw new TokenRefreshException(refreshToken, "Failed to refresh token: " + e.getMessage());
        }
    }


    public void logout(String email, String accessToken, String refreshToken) {
        logger.info("Processing logout for email: {}", email);

        if (accessToken != null && !accessToken.isEmpty()) {
            tokenBlacklistService.blacklistToken(accessToken, email);
            logger.info("Access token blacklisted during logout for user: {}", email);
        }

        if (refreshToken != null && !refreshToken.isEmpty()) {
            tokenBlacklistService.blacklistToken(refreshToken, email);
            logger.info("Refresh token blacklisted during logout for user: {}", email);
        }

        logger.info("User logged out successfully: {}", email);
    }
}
