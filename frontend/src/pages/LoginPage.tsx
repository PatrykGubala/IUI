"use client";

import React, { useState } from "react";
import {
    Box,
    Button,
    VStack,
    HStack,
    Input,
    Text,
    Flex,
    Heading,
    Field,
} from "@chakra-ui/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from './../contexts/AuthContext';
import { toaster } from "./../components/ui/toaster";
import api from "../contexts/AxiosInstance";

const EyeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EyeOffIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07-2.3 2.3" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
);

const LoginPage: React.FC = () => {
    const [usernameOrEmail, setUsernameOrEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading) return;
        setIsLoading(true);

        try {
            const res = await api.post("auth/login/", {
                username: usernameOrEmail,
                password,
            });
            const { access, refresh } = res.data;

            if (res.status === 200) {
                login(access, refresh);
                toaster.create({
                    title: "Logged in",
                    description: "Welcome back!",
                    type: "success",
                });
                navigate("/matches");
            }

        } catch (err) {
            toaster.create({
                title: "Login failed",
                description: "Invalid credentials.",
                type: "error",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Flex minH="80vh" align="center" justify="center">
            <Box
                p={8}
                borderRadius="xl"
                boxShadow="xl"
                bg="white"
                maxW="md"
                w="full"
            >
                <VStack align="stretch" gap={6}>
                    <Box textAlign="center">
                        <Heading size="lg" color="pink.600">
                            Welcome Back
                        </Heading>
                        <Text mt={2} color="gray.500">
                            Log in to continue
                        </Text>
                    </Box>

                    <form onSubmit={handleSubmit}>
                        <VStack align="stretch" gap={4}>
                            <Field.Root required>
                                <Field.Label>Username or Email</Field.Label>
                                <Input
                                    type="text"
                                    placeholder="Enter username or email"
                                    value={usernameOrEmail}
                                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                                />
                            </Field.Root>

                            <Field.Root required>
                                <Field.Label>Password</Field.Label>
                                <Box position="relative" w="full">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        pr="3rem"
                                    />
                                    <Button
                                        size="sm"
                                        position="absolute"
                                        right="0"
                                        top="0"
                                        height="100%"
                                        zIndex="2"
                                        onClick={() => setShowPassword(!showPassword)}
                                        variant="ghost"
                                        color="gray.500"
                                        px={3}
                                    >
                                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                    </Button>
                                </Box>
                            </Field.Root>

                            <Button
                                type="submit"
                                colorScheme="pink"
                                w="full"
                                mt={4}
                                loading={isLoading}
                                loadingText="Logging in..."
                            >
                                Log in
                            </Button>
                        </VStack>
                    </form>
                </VStack>
                <HStack justify="center" pt={6}>
                    <Text fontSize="sm" color="gray.500">
                        New here?
                    </Text>
                    <Button
                        as={RouterLink}
                        to="/register"
                        variant="ghost"
                        colorScheme="pink"
                        size="sm"
                    >
                        Create account
                    </Button>
                </HStack>
            </Box>
        </Flex>
    );
};

export default LoginPage;