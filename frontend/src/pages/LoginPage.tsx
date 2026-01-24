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
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from './../contexts/AuthContext';
import { toaster } from "./../components/ui/toaster";
import api from "../contexts/AxiosInstance";

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const res = await api.post("token/", {
                username,
                password,
            });
            const {access, refresh} = res.data;

            if(res.status === 200) {
                console.log(res.data);
                login(access, refresh);
                toaster.create({
                    title: "Logged in",
                    description: "Welcome back!",
                    type: "success",
                });
                console.log(res.data);
                navigate("/matches");
            }

        } catch (err) {
            toaster.create({
                title: "Login failed",
                description: "Check your email and password.",
                type: "error",
            });
            console.error(err);
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
                <VStack align="stretch">
                    <Box textAlign="center">
                        <Heading size="lg" color="pink.600">
                            Log in to LoveConnect
                        </Heading>
                        <Text mt={2} color="gray.500">
                            Enter your credentials to continue.
                        </Text>
                    </Box>

                    <form onSubmit={handleSubmit}>
                        <VStack align="stretch">
                            <Input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                            <Input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />

                            <Button
                                type="submit"
                                colorScheme="pink"
                                w="full"
                            >
                                Log in
                            </Button>
                        </VStack>
                    </form>
                </VStack>
                <HStack justify="center" pt={2}>
                    <Text fontSize="sm" color="gray.500">
                        Don't have an account?
                    </Text>
                    <Button
                        as={RouterLink}
                        to="/register"
                        variant="ghost"
                        colorScheme="pink"
                        size="sm"
                    >
                        Register
                    </Button>
                </HStack>
            </Box>
        </Flex>
    );
};

export default LoginPage;
