"use client";

import React, { useState } from "react";
import {
    Box,
    Button,
    VStack,
    Input,
    Text,
    Flex,
    Heading,
    HStack,
} from "@chakra-ui/react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAuth } from "./../contexts/AuthContext";
import { toaster } from "./../components/ui/toaster";
import api from "../contexts/AxiosInstance";

const RegisterPage: React.FC = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== password2) {
            toaster.create({
                title: "Passwords do not match",
                description: "Please enter the same password twice.",
                type: "error",
            });
            return;
        }

        try {
            const res = await api.post("http://localhost:8080/api/auth/register", {
                username,
                email,
                password
            });

            if (!res.ok) {
                throw new Error("Registration failed");
            }

            const data = await res.json();
            // Wariant 1: backend od razu zwraca token -> logujemy od razu
            if (data.token && data.user) {
                login(data.token, data.user);
                toaster.create({
                    title: "Registration successful",
                    description: "Welcome to LoveConnect!",
                    type: "success",
                });
                navigate("/matches");
            } else {
                // Wariant 2: brak tokena -> przejście na login
                toaster.create({
                    title: "Registration successful",
                    description: "You can now log in.",
                    type: "success",
                });
                navigate("/login");
            }
        } catch (err) {
            toaster.create({
                title: "Registration failed",
                description: "Try again or use a different email.",
                type: "error",
            });
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
                <VStack spacing={6} align="stretch">
                    <Box textAlign="center">
                        <Heading size="lg" color="pink.600">
                            Create your account
                        </Heading>
                        <Text mt={2} color="gray.500">
                            Join LoveConnect and find your match.
                        </Text>
                    </Box>

                    <form onSubmit={handleSubmit}>
                        <VStack spacing={4} align="stretch">
                            <Input
                                placeholder="Name"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                            <Input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <Input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <Input
                                type="password"
                                placeholder="Repeat password"
                                value={password2}
                                onChange={(e) => setPassword2(e.target.value)}
                                required
                            />

                            <Button type="submit" colorScheme="pink" w="full">
                                Register
                            </Button>
                        </VStack>
                    </form>

                    <HStack justify="center" pt={2}>
                        <Text fontSize="sm" color="gray.500">
                            Already have an account?
                        </Text>
                        <Button
                            as={RouterLink}
                            to="/login"
                            variant="link"
                            colorScheme="pink"
                            size="sm"
                        >
                            Log in
                        </Button>
                    </HStack>
                </VStack>
            </Box>
        </Flex>
    );
};

export default RegisterPage;
