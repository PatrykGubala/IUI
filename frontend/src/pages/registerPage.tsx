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
    Field,
    NativeSelect,
    Tag,
    Wrap,
    WrapItem,
} from "@chakra-ui/react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { toaster } from "./../components/ui/toaster";
import api from "../contexts/AxiosInstance";
import { MapPicker } from "../components/MapPicker";

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

const TAG_GROUPS = {
    "Sports": ["Football", "Yoga", "Gym", "Running", "Tennis"],
    "Tech": ["Coding", "Gaming", "AI", "Crypto", "Gadgets"],
    "Art": ["Painting", "Music", "Photography", "Design", "Writing"],
    "Lifestyle": ["Travel", "Cooking", "Reading", "Movies", "Fashion"]
};

const RegisterPage: React.FC = () => {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        email: "",
        username: "",
        password: "",
        password2: "",
        firstName: "",
        lastName: "",
        age: "",
        gender: "",
        interestedIn: [] as string[],
        tags: [] as string[],
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showPassword2, setShowPassword2] = useState(false);

    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const navigate = useNavigate();

    const regex = {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        username: /^[a-zA-Z0-9_]{3,20}$/,
        name: /^[a-zA-Z\s-]+$/,
        password: /^.{3,}$/
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const validateStep = (currentStep: number) => {
        const newErrors: Record<string, string> = {};
        let isValid = true;

        if (currentStep === 1) {
            if (!regex.email.test(formData.email)) {
                newErrors.email = "Invalid email address.";
                isValid = false;
            }
            if (!regex.username.test(formData.username)) {
                newErrors.username = "Username must be 3-20 chars (letters, numbers, _).";
                isValid = false;
            }
            if (!regex.password.test(formData.password)) {
                newErrors.password = "Password must be at least 3 characters long.";
                isValid = false;
            }
            if (formData.password !== formData.password2) {
                newErrors.password2 = "Passwords do not match.";
                isValid = false;
            }
        }

        if (currentStep === 2) {
            if (!regex.name.test(formData.firstName)) {
                newErrors.firstName = "Letters only.";
                isValid = false;
            }
            if (!regex.name.test(formData.lastName)) {
                newErrors.lastName = "Letters only.";
                isValid = false;
            }
            if (!formData.age || Number(formData.age) < 18) {
                newErrors.age = "Must be 18+.";
                isValid = false;
            }
            if (!formData.gender) {
                newErrors.gender = "Required.";
                isValid = false;
            }
            if (!formData.interestedIn.length) {
                newErrors.interestedIn = "Select at least one.";
                isValid = false;
            }
        }

        if (currentStep === 3) {
            if (formData.tags.length < 3) {
                newErrors.tags = "Select at least 3 interests.";
                isValid = false;
            }
        }

        setErrors(newErrors);
        return isValid;
    };

    const toggleTag = (tag: string) => {
        setFormData(prev => {
            const tags = prev.tags.includes(tag)
                ? prev.tags.filter(t => t !== tag)
                : [...prev.tags, tag];
            return { ...prev, tags };
        });
        if (errors.tags) handleChange("tags", null);
    };

    const toggleInterest = (gender: string) => {
        setFormData(prev => {
            const interestedIn = prev.interestedIn.includes(gender)
                ? prev.interestedIn.filter(g => g !== gender)
                : [...prev.interestedIn, gender];
            return { ...prev, interestedIn };
        });
        if (errors.interestedIn) handleChange("interestedIn", null);
    };

    const nextStep = () => {
        if (validateStep(step)) {
            setStep(s => Math.min(4, s + 1));
        }
    };

    const prevStep = () => setStep(s => Math.max(1, s - 1));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading) return;
        if (!coords) {
            toaster.create({
                title: "Location required",
                description: "Please select your location on the map.",
                type: "error"
            });
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            const res = await api.post("auth/register/", {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                first_name: formData.firstName,
                last_name: formData.lastName,
                age: Number(formData.age),
                gender: formData.gender,
                interested_in: formData.interestedIn,
                latitude: coords.lat,
                longitude: coords.lng,
                tags: formData.tags
            });

            toaster.create({
                title: `Welcome ${res.data.username}!`,
                description: "Registration successful. You can now log in.",
                type: "success",
            });
            navigate("/login");
        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.data) {
                const backendErrors = err.response.data;
                const newErrors: Record<string, string> = {};

                Object.keys(backendErrors).forEach(key => {
                    const msg = Array.isArray(backendErrors[key]) ? backendErrors[key][0] : String(backendErrors[key]);
                    newErrors[key] = msg;
                });

                setErrors(newErrors);

                if (newErrors.email || newErrors.username || newErrors.password) setStep(1);
                else if (newErrors.first_name || newErrors.last_name || newErrors.age) setStep(2);

                toaster.create({
                    title: "Registration failed",
                    description: "Please check the form for errors.",
                    type: "error",
                });
            } else {
                toaster.create({
                    title: "Error",
                    description: "An unexpected error occurred.",
                    type: "error",
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Flex minH="90vh" align="center" justify="center" py={8}>
            <Box p={8} borderRadius="xl" boxShadow="xl" bg="white" maxW="lg" w="full">
                <VStack align="stretch" gap={6}>
                    <Box textAlign="center">
                        <Heading size="lg" color="pink.600">Create Account</Heading>
                        <Text mt={2} color="gray.500">Step {step} of 4</Text>
                    </Box>

                    <form onSubmit={handleSubmit}>
                        {step === 1 && (
                            <VStack align="stretch" gap={4}>
                                <Field.Root invalid={!!errors.email} required>
                                    <Field.Label>Email</Field.Label>
                                    <Input
                                        type="email"
                                        placeholder="your@email.com"
                                        value={formData.email}
                                        onChange={(e) => handleChange("email", e.target.value)}
                                    />
                                    <Field.ErrorText>{errors.email}</Field.ErrorText>
                                </Field.Root>

                                <Field.Root invalid={!!errors.username} required>
                                    <Field.Label>Username</Field.Label>
                                    <Input
                                        placeholder="Username"
                                        value={formData.username}
                                        onChange={(e) => handleChange("username", e.target.value)}
                                    />
                                    <Field.ErrorText>{errors.username}</Field.ErrorText>
                                </Field.Root>

                                <Field.Root invalid={!!errors.password} required>
                                    <Field.Label>Password</Field.Label>
                                    <Box position="relative" w="full">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Password"
                                            value={formData.password}
                                            onChange={(e) => handleChange("password", e.target.value)}
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
                                    <Field.ErrorText>{errors.password}</Field.ErrorText>
                                </Field.Root>

                                <Field.Root invalid={!!errors.password2} required>
                                    <Field.Label>Confirm Password</Field.Label>
                                    <Box position="relative" w="full">
                                        <Input
                                            type={showPassword2 ? "text" : "password"}
                                            placeholder="Repeat password"
                                            value={formData.password2}
                                            onChange={(e) => handleChange("password2", e.target.value)}
                                            pr="3rem"
                                        />
                                        <Button
                                            size="sm"
                                            position="absolute"
                                            right="0"
                                            top="0"
                                            height="100%"
                                            zIndex="2"
                                            onClick={() => setShowPassword2(!showPassword2)}
                                            variant="ghost"
                                            color="gray.500"
                                            px={3}
                                        >
                                            {showPassword2 ? <EyeOffIcon /> : <EyeIcon />}
                                        </Button>
                                    </Box>
                                    <Field.ErrorText>{errors.password2}</Field.ErrorText>
                                </Field.Root>

                                <Button onClick={nextStep} colorScheme="pink" w="full" mt={4}>
                                    Next: Personal Info
                                </Button>
                            </VStack>
                        )}

                        {step === 2 && (
                            <VStack align="stretch" gap={4}>
                                <HStack>
                                    <Field.Root invalid={!!errors.firstName} required>
                                        <Field.Label>First Name</Field.Label>
                                        <Input
                                            value={formData.firstName}
                                            onChange={(e) => handleChange("firstName", e.target.value)}
                                        />
                                        <Field.ErrorText>{errors.firstName}</Field.ErrorText>
                                    </Field.Root>
                                    <Field.Root invalid={!!errors.lastName} required>
                                        <Field.Label>Last Name</Field.Label>
                                        <Input
                                            value={formData.lastName}
                                            onChange={(e) => handleChange("lastName", e.target.value)}
                                        />
                                        <Field.ErrorText>{errors.lastName}</Field.ErrorText>
                                    </Field.Root>
                                </HStack>

                                <Field.Root invalid={!!errors.age} required>
                                    <Field.Label>Age</Field.Label>
                                    <Input
                                        type="number"
                                        value={formData.age}
                                        onChange={(e) => handleChange("age", e.target.value)}
                                    />
                                    <Field.ErrorText>{errors.age}</Field.ErrorText>
                                </Field.Root>

                                <Field.Root invalid={!!errors.gender} required>
                                    <Field.Label>Gender</Field.Label>
                                    {/* Użycie NativeSelect zamiast Select */}
                                    <NativeSelect.Root>
                                        <NativeSelect.Field
                                            placeholder="Select gender"
                                            value={formData.gender}
                                            onChange={(e) => handleChange("gender", e.target.value)}
                                        >
                                            <option value="M">Male</option>
                                            <option value="F">Female</option>
                                            <option value="O">Other</option>
                                        </NativeSelect.Field>
                                    </NativeSelect.Root>
                                    <Field.ErrorText>{errors.gender}</Field.ErrorText>
                                </Field.Root>

                                <Field.Root invalid={!!errors.interestedIn} required>
                                    <Field.Label>Interested in</Field.Label>
                                    <HStack gap={4}>
                                        {['M', 'F', 'O'].map((g) => (
                                            <Button
                                                key={g}
                                                size="sm"
                                                variant={formData.interestedIn.includes(g) ? 'solid' : 'outline'}
                                                colorScheme="pink"
                                                onClick={() => toggleInterest(g)}
                                            >
                                                {g === 'M' ? 'Men' : g === 'F' ? 'Women' : 'Other'}
                                            </Button>
                                        ))}
                                    </HStack>
                                    <Field.ErrorText>{errors.interestedIn}</Field.ErrorText>
                                </Field.Root>

                                <HStack mt={4}>
                                    <Button onClick={prevStep} variant="ghost" w="50%">Back</Button>
                                    <Button onClick={nextStep} colorScheme="pink" w="50%">Next: Interests</Button>
                                </HStack>
                            </VStack>
                        )}

                        {step === 3 && (
                            <VStack align="stretch" gap={4}>
                                <Text fontSize="sm" color="gray.600">Select at least 3 interests</Text>
                                <Field.Root invalid={!!errors.tags}>
                                    {Object.entries(TAG_GROUPS).map(([group, tags]) => (
                                        <Box key={group} mb={4}>
                                            <Text fontWeight="bold" fontSize="sm" color="pink.500" mb={2}>{group}</Text>
                                            <Wrap gap={2}>
                                                {tags.map(tag => (
                                                    <WrapItem key={tag}>
                                                        <Tag.Root
                                                            size="lg"
                                                            variant={formData.tags.includes(tag) ? "solid" : "outline"}
                                                            colorPalette="pink"
                                                            cursor="pointer"
                                                            onClick={() => toggleTag(tag)}
                                                        >
                                                            <Tag.Label>{tag}</Tag.Label>
                                                        </Tag.Root>
                                                    </WrapItem>
                                                ))}
                                            </Wrap>
                                        </Box>
                                    ))}
                                    <Field.ErrorText>{errors.tags}</Field.ErrorText>
                                </Field.Root>

                                <HStack mt={4}>
                                    <Button onClick={prevStep} variant="ghost" w="50%">Back</Button>
                                    <Button onClick={nextStep} colorScheme="pink" w="50%">Next: Location</Button>
                                </HStack>
                            </VStack>
                        )}

                        {step === 4 && (
                            <VStack align="stretch" gap={4}>
                                <Text fontSize="md" fontWeight="medium">Set your location</Text>
                                <Box border="1px solid" borderColor="gray.200" borderRadius="md" overflow="hidden">
                                    <MapPicker value={coords} onChange={setCoords} />
                                </Box>

                                {coords && (
                                    <Text fontSize="sm" color="gray.600">
                                        Lat: {coords.lat.toFixed(5)}, Lng: {coords.lng.toFixed(5)}
                                    </Text>
                                )}

                                <HStack mt={4}>
                                    <Button onClick={prevStep} variant="ghost" w="50%" disabled={isLoading}>Back</Button>
                                    <Button
                                        type="submit"
                                        colorScheme="pink"
                                        w="50%"
                                        loading={isLoading}
                                        loadingText="Registering..."
                                    >
                                        Complete
                                    </Button>
                                </HStack>
                            </VStack>
                        )}
                    </form>

                    <HStack justify="center" pt={2}>
                        <Text fontSize="sm" color="gray.500">Already a member?</Text>
                        <Button as={RouterLink} to="/login" variant="ghost" colorScheme="pink" size="sm">
                            Log in
                        </Button>
                    </HStack>
                </VStack>
            </Box>
        </Flex>
    );
};

export default RegisterPage;