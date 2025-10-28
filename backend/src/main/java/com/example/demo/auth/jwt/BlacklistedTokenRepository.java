package com.example.demo.auth.jwt;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface BlacklistedTokenRepository extends JpaRepository<BlacklistedToken, Long> {
    boolean existsByToken(String token);
    List<BlacklistedToken> findAllByExpiryDateBefore(Date date);
    List<BlacklistedToken> findByUser_Id(Long userId);
}


