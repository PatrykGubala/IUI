package com.example.demo.auth.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Date;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private final JwtTokenProvider jwtTokenProvider;
    private final TokenBlacklistService tokenBlacklistService;
    private final ServerStartupManager serverStartupManager;

    public JwtAuthenticationFilter(
            JwtTokenProvider jwtTokenProvider,
            TokenBlacklistService tokenBlacklistService,
            ServerStartupManager serverStartupManager) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.tokenBlacklistService = tokenBlacklistService;
        this.serverStartupManager = serverStartupManager;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt)) {
                try {
                    Date issuedAt = jwtTokenProvider.getIssuedAtFromToken(jwt);
                    Date serverStartupTime = serverStartupManager.getServerStartupTime();

                    if (issuedAt == null) {
                        logger.warn("Token doesn't contain issuedAt (iat) claim, rejecting");
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        filterChain.doFilter(request, response);
                        return;
                    }

                    if (issuedAt.before(serverStartupTime)) {
                        String username = jwtTokenProvider.getEmailFromToken(jwt);
                        logger.warn("Token for user {} was issued at {} before server startup at {}, rejecting",
                                username, issuedAt, serverStartupTime);
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        filterChain.doFilter(request, response);
                        return;
                    }

                    if (tokenBlacklistService.isTokenBlacklisted(jwt)) {
                        logger.warn("Token is blacklisted, rejecting");
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        filterChain.doFilter(request, response);
                        return;
                    }

                    String username = jwtTokenProvider.getEmailFromToken(jwt);

                    if (!jwtTokenProvider.isTokenExpired(jwt)) {
                        List<String> roles = jwtTokenProvider.getRolesFromToken(jwt);
                        List<SimpleGrantedAuthority> authorities = roles.stream()
                                .map(SimpleGrantedAuthority::new)
                                .toList();

                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(username, null, authorities);
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        logger.info("Authenticated user: {}, setting security context", username);
                    } else {
                        logger.warn("Token is expired, rejecting");
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        filterChain.doFilter(request, response);
                        return;
                    }
                } catch (Exception e) {
                    logger.error("Token validation error: {}", e.getMessage());
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    filterChain.doFilter(request, response);
                    return;
                }
            }
        } catch (Exception e) {
            logger.error("Cannot set user authentication: {}", e.getMessage());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            filterChain.doFilter(request, response);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}

