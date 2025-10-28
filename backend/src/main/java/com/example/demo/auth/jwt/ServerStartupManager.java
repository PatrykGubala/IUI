package com.example.demo.auth.jwt;

import lombok.Getter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationStartedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
public class ServerStartupManager {
    private final Logger logger = LoggerFactory.getLogger(ServerStartupManager.class);
    @Getter
    private Date serverStartupTime;

    public ServerStartupManager() {
        this.serverStartupTime = new Date();
    }

    @EventListener(ApplicationStartedEvent.class)
    public void onApplicationStarted() {
        this.serverStartupTime = new Date();
        logger.info("Application started at: {}", this.serverStartupTime);
        logger.info("All tokens issued before this time are now invalid");
    }

}
