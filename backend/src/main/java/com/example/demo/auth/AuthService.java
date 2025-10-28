package com.example.demo.auth;


import com.example.demo.auth.user.LoginRequest;
import com.example.demo.auth.user.RegisterRequest;
import com.example.demo.auth.user.UserDto;

import java.util.Map;

public interface AuthService {
    UserDto register(RegisterRequest registerRequest);
    Map<String, String> login(LoginRequest loginRequest);
    Map<String, String> refreshToken(String refreshToken);
    void logout(String email,String accessToken, String refreshToken);
}


