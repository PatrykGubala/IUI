package com.example.demo.auth.user;


import com.example.demo.model.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserDto toDto(User user) {
        if (user == null) {
            return null;
        }

        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());


        return dto;
    }

    public void updateEntity(User user, UserDto dto) {
        if (dto == null || user == null) {
            return;
        }
        user.setEmail(dto.getEmail());
    }
}