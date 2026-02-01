import React, {useEffect, useState} from "react";
import {
    Box,
    VStack,
    HStack,
    Button,
    Text,
    Input,
    Textarea,
    Tag,
    Wrap,
    WrapItem,
    Editable,
    Field,
    NativeSelect,
} from "@chakra-ui/react";
import { toaster } from "../components/ui/toaster";
import api from "./../contexts/AxiosInstance";
import { TAG_GROUPS } from "./registerPage";
import {MapPicker} from "../components/MapPicker/MapPicker";
import type {Coordinates} from "../components/MapPicker/mapPicker.types";
import type {ProfileData, ValidationErrors} from "../types/types";


const VALIDATION_RULES = {
    NAME_REGEX: /^[a-zA-Z\s-]+$/,
    MAX_DESCRIPTION_LENGTH: 500,
    MIN_AGE: 18,
    MIN_DISTANCE: 1,
} as const;

const DEFAULT_PHOTO_URL = "https://upload.wikimedia.org/wikipedia/commons/a/a2/Person_Image_Placeholder.png";
const USER_PROFILE_URL = 'user/profile/';

const GENDER_OPTIONS = {
    M: 'Men',
    F: 'Women',
    O: 'Other',
} as const;

const TOAST_DURATION = {
    SUCCESS: 2000,
    ERROR: 4000,
} as const;

const INITIAL_PROFILE_DATA: ProfileData = {
    firstName: "",
    lastName: "",
    age: 0,
    gender: "M",
    interestedIn: [],
    location: "",
    max_distance: 50,
    description: "",
    profilePhoto: DEFAULT_PHOTO_URL,
    tags: []
};


const EditableField: React.FC<{
    label: string,
    value: string,
    onChange: (newValue: string) => void,
    type?: "text" | "number",
}> = ({ label, value, onChange, type = "text"}) => (
    <Field.Root>
        <Field.Label color="gray.700" fontWeight="600">
            {label}
        </Field.Label>
        <Editable.Root value={value} onValueChange={(e) => onChange(e.value)}>
            <Editable.Preview
                px={3}
                py={2}
                fontSize="lg"
                borderRadius="lg"
                _hover={{ bg: "pink.50" }}
                cursor="pointer"
            />
            <Editable.Input
                type={type}
                px={3}
                py={2}
                fontSize="lg"
                borderRadius="lg"
                borderColor="pink.300"
                _focus={{
                    borderColor: "pink.400",
                    boxShadow: "0 0 0 1px #f687b3",
                }}
            />
        </Editable.Root>
    </Field.Root>
);


const ProfilePage: React.FC = () => {
    const [profileData, setProfileData] = useState<ProfileData>(INITIAL_PROFILE_DATA);
    const [coords, setCoords] = useState<Coordinates | null>(null);
    const [showMap, setShowMap] = useState<boolean>(false);


    const validateProfileData = (): ValidationErrors => {
        const newErrors: ValidationErrors = {};

        if (!VALIDATION_RULES.NAME_REGEX.test(profileData.firstName)) {
            newErrors.firstName = "Name contains prohibited characters! Use only letters.";
        }

        if (!VALIDATION_RULES.NAME_REGEX.test(profileData.lastName)) {
            newErrors.lastName = "Surname contains prohibited characters! Use only letters.";
        }

        if (profileData.description.length > VALIDATION_RULES.MAX_DESCRIPTION_LENGTH) {
            newErrors.description = "Your description is too long.";
        }

        if (profileData.age < VALIDATION_RULES.MIN_AGE) {
            newErrors.age = `You need to be older than ${VALIDATION_RULES.MIN_AGE} years old!`;
        }

        if (profileData.max_distance < VALIDATION_RULES.MIN_DISTANCE) {
            newErrors.max_distance = "Max distance must be greater than 1 km!";
        }

        return newErrors;
    };

    const showToast = (title: string, type: "success" | "error") => {
        const duration = type === "success" ? TOAST_DURATION.SUCCESS : TOAST_DURATION.ERROR;
        toaster.create({title, type, duration});
    };

    const showValidationErrors = (validationErrors: ValidationErrors): void => {
        Object.values(validationErrors).forEach(errorMessage => {
            showToast(errorMessage, "error");
        });
    };

    const fetchProfileData = async (): Promise<void> => {
        try {
            const response = await api.get(USER_PROFILE_URL);
            setProfileData(response.data);
        } catch (error) {
            showToast("Failed to load profile", "error");
        }
    };

    const uploadProfilePhoto = async (file: File): Promise<void> => {
        const formData = new FormData();
        formData.append("profilePhoto", file);

        try {
            const response = await api.patch("user/profile/", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setProfileData(prev => ({
                ...prev,
                profilePhoto: response.data.profilePhoto ?? prev.profilePhoto
            }));

            showToast("Profile photo updated", "success");
        } catch (error) {
            showToast("Failed to upload photo", "error");
        }
    };

    const saveLocation = async (): Promise<void> => {
        if (!coords) return;

        try {
            const response = await api.patch(USER_PROFILE_URL, {
                latitude: coords.lat,
                longitude: coords.lng,
            });

            setProfileData(response.data);
            showToast("Location saved successfully","success");
        } catch (error) {
            showToast("Failed to save location", "error");
        }
    };

    const saveProfile = async (): Promise<void> => {
        const validationErrors = validateProfileData();

        if (Object.keys(validationErrors).length>0) {
            showValidationErrors(validationErrors);
            return;
        }

        try {
            await api.put(USER_PROFILE_URL, {
                firstName: profileData.firstName,
                lastName: profileData.lastName,
                age: profileData.age,
                description: profileData.description,
                gender: profileData.gender,
                interestedIn: profileData.interestedIn,
                max_distance: profileData.max_distance,
                tags: profileData.tags
            });

            showToast("Profile saved successfully","success");
        } catch (error) {
            showToast("Failed to save profile", "error")
        }
    };

    const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
        const file = event.target.files?.[0];
        if (!file) return;

        await uploadProfilePhoto(file);
        event.target.value = "";
    };

    const handleTagToggle = (tag: string): void => {
        setProfileData(prev => {
            const currentTags = prev.tags || [];
            const isTagSelected = currentTags.includes(tag);
            const newTags = isTagSelected
                ? currentTags.filter(t => t !== tag)
                : [...currentTags, tag];

            return { ...prev, tags: newTags };
        });
    };

    const handleInterestToggle = (gender: string): void => {
        setProfileData(prev => {
            const current = prev.interestedIn || [];
            const isSelected = current.includes(gender);
            const updated = isSelected
                ? current.filter(g => g !== gender)
                : [...current, gender];

            return { ...prev, interestedIn: updated };
        });
    };

    const toggleMapVisibility = (): void => {
        setShowMap(prev => !prev);
    };

    const updateProfileField = <K extends keyof ProfileData>(
        field: K,
        value: ProfileData[K]
    ): void => {
        setProfileData(prev => ({ ...prev, [field]: value }));
    };

    useEffect(() => {
        fetchProfileData();
    }, []);


    return (
        <VStack gap={8} align="stretch">
            <Box textAlign="center">
                <Text fontSize="3xl" fontWeight="bold" color="pink.600" mb={2}>
                    My Profile
                </Text>
                <Text fontSize="md" color="gray.600">
                    Manage your personal information and preferences
                </Text>
            </Box>

            <VStack gap={4}>
                <Box
                    position="relative"
                    w="200px"
                    h="200px"
                    borderRadius="full"
                    overflow="hidden"
                    border="4px solid"
                    borderColor="pink.400"
                    boxShadow="0 4px 24px 0px rgba(238, 63, 155, 0.15)"
                    bg="gray.100"
                    bgImage={`url(${profileData.profilePhoto})`}
                    bgSize="cover"
                />
                <Input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    display="none"
                    id="photo-upload"
                />
                <label htmlFor="photo-upload">
                    <Button
                        as="span"
                        colorScheme="pink"
                        size="sm"
                        borderRadius="full"
                        cursor="pointer"
                    >
                        Change Photo
                    </Button>
                </label>
            </VStack>

            <Box>
                <Text fontSize="xl" fontWeight="semibold" color="pink.600" mb={4}>
                    Basic Information
                </Text>
                <VStack gap={4} align="stretch">
                    <EditableField
                        label="First Name"
                        value={profileData.firstName}
                        onChange={(value) => updateProfileField('firstName', value)}
                        type="text"
                    />

                    <EditableField
                        label="Last Name"
                        value={profileData.lastName}
                        onChange={(value) => updateProfileField('lastName', value)}
                        type="text"
                    />

                    <EditableField
                        label="Age"
                        value={profileData.age?.toString()}
                        onChange={(value) => updateProfileField('age', parseInt(value) || 0)}
                        type="number"
                    />

                    <HStack w="full" gap={4} align="start">
                        <Box w="50%">
                            <Text color="gray.700" fontWeight="600" mb={1}>Gender</Text>
                            <NativeSelect.Root>
                                <NativeSelect.Field
                                    value={profileData.gender}
                                    onChange={(e) => updateProfileField('gender', e.target.value)}
                                >
                                    {Object.entries(GENDER_OPTIONS).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </NativeSelect.Field>
                            </NativeSelect.Root>
                        </Box>
                        <Box w="50%">
                            <Text color="gray.700" fontWeight="600" mb={2}>Interested In</Text>
                            <HStack gap={2} wrap="wrap">
                                {Object.entries(GENDER_OPTIONS).map(([value, label]) => (
                                    <Button
                                        key={value}
                                        size="sm"
                                        variant={profileData.interestedIn?.includes(value) ? 'solid' : 'outline'}
                                        colorScheme="pink"
                                        onClick={() => handleInterestToggle(value)}
                                        borderRadius="full"
                                    >
                                        {label}
                                    </Button>
                                ))}
                            </HStack>
                        </Box>
                    </HStack>

                    <Field.Root>
                        <Field.Label color="gray.700" fontWeight="600">
                            Location
                        </Field.Label>
                        <Box>
                            <Box
                                px={3}
                                py={2}
                                fontSize="lg"
                                borderRadius="lg"
                                bg={showMap ? "pink.100" : "transparent"}
                                _hover={{ bg: "pink.50" }}
                                cursor="pointer"
                                onClick={toggleMapVisibility}
                                border="1px solid"
                                borderColor="pink.200"
                                minW="400px"
                            >
                                <Text>{profileData.location}</Text>
                            </Box>
                            {showMap && (
                                <Box px={3} py={3} mt={4} border="1px solid" borderColor="pink.200" borderRadius="xl" overflow="hidden">
                                    <MapPicker value={coords} onChange={setCoords} />
                                    <HStack mt={4} justify="space-around" gap={3}>
                                        <Button
                                            onClick={toggleMapVisibility}
                                            variant="outline"
                                            colorScheme="gray"
                                            borderRadius="full"
                                            px={6}
                                            w="45%"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={saveLocation}
                                            colorScheme="pink"
                                            borderRadius="full"
                                            px={6}
                                            boxShadow="0 4px 12px 0px rgba(238, 63, 155, 0.20)"
                                            _hover={{
                                                transform: "translateY(-1px)",
                                                boxShadow: "0 6px 16px 0px rgba(238, 63, 155, 0.25)",
                                            }}
                                            w="45%"
                                        >
                                            Save
                                        </Button>
                                    </HStack>
                                </Box>
                            )}
                        </Box>
                    </Field.Root>

                    <EditableField
                        label="Max distance (km)"
                        value={profileData.max_distance?.toString()}
                        onChange={(value) => updateProfileField('max_distance', parseInt(value))}
                        type="number"
                    />

                </VStack>
            </Box>

            <Box>
                <Text fontSize="xl" fontWeight="semibold" color="pink.600" mb={4}>
                    About Me
                </Text>
                <Textarea
                    value={profileData.description}
                    onChange={(e) => updateProfileField('description', e.target.value)}
                    placeholder="Tell us about yourself..."
                    size="lg"
                    minH="150px"
                    borderColor="pink.300"
                    borderRadius="xl"
                    _hover={{ borderColor: "pink.400" }}
                    _focus={{
                        borderColor: "pink.400",
                        boxShadow: "0 0 0 1px #f687b3",
                    }}
                />
            </Box>

            <Box>
                <Text fontSize="xl" fontWeight="semibold" color="pink.600" mb={4}>
                    Interests & Hobbies
                </Text>
                {Object.entries(TAG_GROUPS).map(([groupName, tags]) => (
                    <Box key={groupName} mb={4}>
                        <Text fontWeight="bold" fontSize="sm" color="pink.500" mb={2}>
                            {groupName}
                        </Text>
                        <Wrap gap={2}>
                            {tags.map((tag) => (
                                <WrapItem key={tag}>
                                    <Tag.Root
                                        size="lg"
                                        borderRadius="full"
                                        variant={profileData.tags?.includes(tag) ? "solid" : "outline"}
                                        colorPalette="pink"
                                        cursor="pointer"
                                        onClick={() => handleTagToggle(tag)}
                                        px={4}
                                        py={2}
                                        transition="all 0.2s"
                                        _hover={{ transform: "scale(1.05)" }}
                                    >
                                        <Tag.Label>{tag}</Tag.Label>
                                    </Tag.Root>
                                </WrapItem>
                            ))}
                        </Wrap>
                    </Box>
                ))}
            </Box>

            <Button
                onClick={saveProfile}
                colorPalette="pink"
                size="lg"
                borderRadius="full"
                fontWeight="bold"
                boxShadow="0 4px 24px 0px rgba(238, 63, 155, 0.20)"
                _hover={{
                    transform: "translateY(-2px)",
                    boxShadow: "0 6px 28px 0px rgba(238, 63, 155, 0.25)",
                }}
                transition="all 0.2s"
            >
                Save Profile
            </Button>
        </VStack>
    );
};

export default ProfilePage;