package com.example.demo.auth.jwt;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.Date;
import java.util.List;

@Component
public class ExpiredTokenCleanupTask {

    private final Logger logger = LoggerFactory.getLogger(ExpiredTokenCleanupTask.class);
    private final BlacklistedTokenRepository blacklistedTokenRepository;

    public ExpiredTokenCleanupTask(BlacklistedTokenRepository blacklistedTokenRepository) {
        this.blacklistedTokenRepository = blacklistedTokenRepository;
    }

    @Scheduled(cron = "0 0 10 * * ?")
    @Transactional
    public void removeExpiredBlacklistedTokens() {
        Date now = new Date();
        logger.info("Running cleanup task for expired blacklisted tokens older than {}", now);
        List<BlacklistedToken> expiredTokens = blacklistedTokenRepository.findAllByExpiryDateBefore(now);
        if (!expiredTokens.isEmpty()) {
            blacklistedTokenRepository.deleteAll(expiredTokens);
            logger.info("Removed {} expired blacklisted tokens.", expiredTokens.size());
        } else {
            logger.info("No expired blacklisted tokens found to remove.");
        }
    }
}

