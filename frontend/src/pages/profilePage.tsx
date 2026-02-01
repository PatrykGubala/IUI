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

const ProfilePage: React.FC = () => {
    const [profileData, setProfileData] = useState({
        firstName: "Jan",
        lastName: "Kowalski",
        age: 24,
        gender: "M",
        interestedIn: [] as string[],
        location: "Kraków, Poland",
        max_distance: 50,
        description:
            "Computer science student passionate about exploring new technologies.",
        profilePhoto: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Person_Image_Placeholder.png",
        tags: [] as string[]
    });

    const [newTag, setNewTag] = useState("");

    const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if(!file) return;

        const formData = new FormData();
        formData.append("profilePhoto",file);

        try{
            const res = await api.patch("user/profile/", formData, {
                headers: {
                    "Content-Type":"multipart/form-data",
                },
            });

            setProfileData((prev) => ({
                ...prev,
                profilePhoto: res.data.profilePhoto ?? prev.profilePhoto
            }));

            toaster.create({
                title: "Profile photo updated",
                type: "success",
                duration: 2000,
            });
        } catch (err) {
            console.error(err);
            toaster.create({
                title: "Failed to upload photo",
                type: "error",
            });
        } finally {
            event.target.value = "";
        }
    };

    const handleAddTag = () => {
        if (newTag.trim() && !profileData.tags.includes(newTag.trim())) {
            setProfileData({
                ...profileData,
                tags: [...profileData.tags, newTag.trim()]
            });
            setNewTag("");
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setProfileData({
            ...profileData,
            tags: profileData.tags.filter((tag) => tag !== tagToRemove)
        });
    };

    const handleInterestToggle = (gender: string) => {
        setProfileData(prev => {
            const current = prev.interestedIn || [];
            const updated = current.includes(gender)
                ? current.filter(g => g !== gender)
                : [...current, gender];
            return { ...prev, interestedIn: updated };
        });
    };

    const handleSave = async () => {
        try {
            await api.put('user/profile/', {
                firstName: profileData.firstName,
                lastName: profileData.lastName,
                age: profileData.age,
                description: profileData.description,
                gender: profileData.gender,
                interestedIn: profileData.interestedIn,
                max_distance: profileData.max_distance,
                tags: profileData.tags
            });
            toaster.create({
                title: "Profile saved successfully",
                type: "success",
                duration: 2000,
            });
        } catch (err) {
            toaster.create({
                title: "Failed to save profile",
                type: "error",
            });
            console.error(err);
        }
    };

    const fetchData = async () =>{
        try{
            const userResponse = await api.get('user/profile/');
            setProfileData(userResponse.data);
        }
        catch(err) {
            console.log(err);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <>
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
                        <Field.Root>
                            <Field.Label color="gray.700" fontWeight="600">
                                First Name
                            </Field.Label>
                            <Editable.Root
                                value={profileData.firstName}
                                onValueChange={(e) =>
                                    setProfileData({ ...profileData, firstName: e.value })
                                }
                            >
                                <Editable.Preview
                                    px={3}
                                    py={2}
                                    fontSize="lg"
                                    borderRadius="lg"
                                    _hover={{ bg: "pink.50" }}
                                    cursor="pointer"
                                />
                                <Editable.Input
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

                        <Field.Root>
                            <Field.Label color="gray.700" fontWeight="600">
                                Last Name
                            </Field.Label>
                            <Editable.Root
                                value={profileData.lastName}
                                onValueChange={(e) =>
                                    setProfileData({ ...profileData, lastName: e.value })
                                }
                            >
                                <Editable.Preview
                                    px={3}
                                    py={2}
                                    fontSize="lg"
                                    borderRadius="lg"
                                    _hover={{ bg: "pink.50" }}
                                    cursor="pointer"
                                />
                                <Editable.Input
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

                        <Field.Root>
                            <Field.Label color="gray.700" fontWeight="600">
                                Age
                            </Field.Label>
                            <Editable.Root
                                value={profileData.age?.toString()}
                                onValueChange={(e) =>
                                    setProfileData({
                                        ...profileData,
                                        age: parseInt(e.value) || 0,
                                    })
                                }
                            >
                                <Editable.Preview
                                    px={3}
                                    py={2}
                                    fontSize="lg"
                                    borderRadius="lg"
                                    _hover={{ bg: "pink.50" }}
                                    cursor="pointer"
                                />
                                <Editable.Input
                                    type="number"
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

                        <HStack w="full" gap={4} align="start">
                            <Box w="50%">
                                <Text color="gray.700" fontWeight="600" mb={1}>Gender</Text>
                                <NativeSelect.Root>
                                    <NativeSelect.Field
                                        value={profileData.gender}
                                        onChange={(e) => setProfileData({...profileData, gender: e.target.value})}
                                    >
                                        <option value="M">Male</option>
                                        <option value="F">Female</option>
                                        <option value="O">Other</option>
                                    </NativeSelect.Field>
                                </NativeSelect.Root>
                            </Box>
                            <Box w="50%">
                                <Text color="gray.700" fontWeight="600" mb={2}>Interested In</Text>
                                <HStack gap={2} wrap="wrap">
                                    {['M', 'F', 'O'].map((g) => (
                                        <Button
                                            key={g}
                                            size="sm"
                                            variant={profileData.interestedIn?.includes(g) ? 'solid' : 'outline'}
                                            colorScheme="pink"
                                            onClick={() => handleInterestToggle(g)}
                                            borderRadius="full"
                                        >
                                            {g === 'M' ? 'Men' : g === 'F' ? 'Women' : 'Other'}
                                        </Button>
                                    ))}
                                </HStack>
                            </Box>
                        </HStack>

                        <Field.Root>
                            <Field.Label color="gray.700" fontWeight="600">
                                Location
                            </Field.Label>
                            <Editable.Root
                                value={profileData.location}
                                onValueChange={(e) =>
                                    setProfileData({ ...profileData, location: e.value })
                                }
                            >
                                <Editable.Preview
                                    px={3}
                                    py={2}
                                    fontSize="lg"
                                    borderRadius="lg"
                                    _hover={{ bg: "pink.50" }}
                                    cursor="pointer"
                                />
                                <Editable.Input
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


                        <Field.Root>
                            <Field.Label color="gray.700" fontWeight="600">
                                Max distance (km)
                            </Field.Label>
                            <Editable.Root
                                value={profileData.max_distance?.toString()}
                                onValueChange={(e) =>
                                    setProfileData({ ...profileData, max_distance: parseInt(e.value) })
                                }
                            >
                                <Editable.Preview
                                    px={3}
                                    py={2}
                                    fontSize="lg"
                                    borderRadius="lg"
                                    _hover={{ bg: "pink.50" }}
                                    cursor="pointer"
                                />
                                <Editable.Input
                                    type="number"
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
                    </VStack>
                </Box>

                <Box>
                    <Text fontSize="xl" fontWeight="semibold" color="pink.600" mb={4}>
                        About Me
                    </Text>
                    <Textarea
                        value={profileData.description}
                        onChange={(e) =>
                            setProfileData({ ...profileData, description: e.target.value })
                        }
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
                    <Wrap gap={3} mb={4}>
                        {profileData.tags && profileData.tags.map((tag, index) => (
                            <WrapItem key={index}>
                                <Tag.Root
                                    size="lg"
                                    borderRadius="full"
                                    variant="solid"
                                    colorPalette="pink"
                                    px={4}
                                    py={2}
                                >
                                    <Tag.Label>{tag}</Tag.Label>
                                    <Tag.EndElement>
                                        <Tag.CloseTrigger onClick={() => handleRemoveTag(tag)} />
                                    </Tag.EndElement>
                                </Tag.Root>
                            </WrapItem>
                        ))}
                    </Wrap>
                    <HStack>
                        <Input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Add a new tag..."
                            borderRadius="lg"
                            borderColor="pink.300"
                            _hover={{ borderColor: "pink.400" }}
                            _focus={{
                                borderColor: "pink.400",
                                boxShadow: "0 0 0 1px #f687b3",
                            }}
                            onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                    handleAddTag();
                                }
                            }}
                        />
                        <Button
                            onClick={handleAddTag}
                            colorPalette="pink"
                            borderRadius="lg"
                            px={8}
                        >
                            Add
                        </Button>
                    </HStack>
                </Box>

                <Button
                    onClick={handleSave}
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
        </>
    );
};

export default ProfilePage;