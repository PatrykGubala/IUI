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
import { toaster } from "./../components/ui/toaster";
import api from "../contexts/AxiosInstance";
import {MapPicker} from "../components/MapPicker.tsx";

const RegisterPage: React.FC = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [age, setAge] = useState();
    const [coords, setCoords] = useState<{lat:number; lng:number} | null>(null);

    const [step, setStep] = useState(1);

    const navigate = useNavigate();


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
            const res = await api.post("auth/register/", {
                username,
                email,
                password,
                first_name: firstName,
                last_name: lastName,
                age,
                latitude: coords?.lat,
                longitude: coords?.lng,
            });

            toaster.create({
                title: `Registration successful ${res.data.username}`,
                description: "You can now log in.",
                type: "success",
            });
            navigate("/login");
        } catch (err) {
            toaster.create({
                title: "Registration failed",
                description: "Try again or use a different email.",
                type: "error",
            });
            console.error(err);
        }
    };

    const nextStep = () => setStep(s => Math.min(3, s+1));
    const prevStep = () => setStep(s => Math.max(1, s-1));

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
                            Create your account
                        </Heading>
                        <Text mt={2} color="gray.500">
                            Join LoveConnect and find your match.
                        </Text>
                    </Box>

                    <form onSubmit={handleSubmit}>
                        {step === 1 && (
                            <VStack align="stretch">
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

                                <Button onClick={nextStep} colorScheme="pink" w="full">
                                    Next Step
                                </Button>
                            </VStack>
                        )}

                        {step === 2 && (
                            <VStack align="stretch">
                                <Input
                                    placeholder="First Name"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                />
                                <Input
                                    placeholder="Last Name"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                />
                                <Input
                                    type="number"
                                    placeholder="Your Age"
                                    value={age}
                                    onChange={(e) => setAge(Number(e.target.value))}
                                    required
                                />

                                <HStack>
                                    <Button onClick={prevStep} colorScheme="pink" w="50%">
                                        Go Back
                                    </Button>

                                    <Button onClick={nextStep} colorScheme="pink" w="50%">
                                        Next Step
                                    </Button>
                                </HStack>

                            </VStack>
                        )}

                        {step === 3 && (
                            <VStack align="stretch">
                                <Box>
                                    <MapPicker value={coords} onChange={setCoords} />
                                </Box>

                                {coords && (
                                    <Text fontSize="sm" color="gray.600" mt={2}>
                                        Wybrana lokalizacja: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                                    </Text>
                                )}

                                <HStack w="full">
                                    <Button onClick={prevStep} colorScheme="pink" w="50%">
                                        Go Back
                                    </Button>

                                    <Button type="submit" colorScheme="pink" w="50%">
                                        Register
                                    </Button>
                                </HStack>

                            </VStack>
                        )}
                    </form>

                    <HStack justify="center" pt={2}>
                        <Text fontSize="sm" color="gray.500">
                            Already have an account?
                        </Text>
                        <Button
                            as={RouterLink}
                            to="/login"
                            variant="ghost"
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
