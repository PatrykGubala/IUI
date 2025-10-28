"use client";

import React from "react";
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  SimpleGrid,
  Flex,
  Icon,
} from "@chakra-ui/react";
import { FaHeart, FaUsers, FaShieldAlt, FaComment } from "react-icons/fa";
import Layout from "../components/ui/layout";

const HomePage: React.FC = () => {
  return (
    <>
      <VStack gap={12} py={10}>
        <Box textAlign="center" maxW="800px" mx="auto" px={6}>
          <Text
            fontSize={{ base: "4xl", md: "5xl" }}
            fontWeight="bold"
            color="pink.600"
            mb={4}
          >
            💗 LoveConnect
          </Text>
          <Text
            fontSize={{ base: "xl", md: "2xl" }}
            color="gray.600"
            fontWeight="medium"
            mb={6}
          >
            Find Your Perfect Match Today
          </Text>
          <Text fontSize="lg" color="gray.500" mb={8}>
            Connect with like-minded people, discover meaningful relationships,
            and find your adventure partner. Join thousands of singles looking
            for love.
          </Text>
          <HStack justify="center" gap={4}>
            <Button
              size="lg"
              colorPalette="pink"
              borderRadius="full"
              px={10}
              py={6}
              fontSize="lg"
              fontWeight="bold"
              boxShadow="0 4px 24px 0px rgba(238, 63, 155, 0.20)"
              _hover={{
                transform: "translateY(-2px)",
                boxShadow: "0 6px 28px 0px rgba(238, 63, 155, 0.25)",
              }}
              transition="all 0.2s"
            >
              Get Started Free
            </Button>
            <Button
              size="lg"
              variant="outline"
              borderRadius="full"
              px={10}
              py={6}
              fontSize="lg"
              borderColor="pink.400"
              color="pink.600"
              _hover={{
                bg: "pink.50",
              }}
            >
              Learn More
            </Button>
          </HStack>
        </Box>

        <SimpleGrid
          columns={{ base: 1, md: 3 }}
          gap={8}
          w="100%"
          maxW="900px"
          px={6}
        >
          <Box
            bg="pink.50"
            p={8}
            borderRadius="2xl"
            textAlign="center"
            boxShadow="0 4px 16px rgba(238, 63, 155, 0.1)"
          >
            <Text fontSize="4xl" fontWeight="bold" color="pink.600">
              50K+
            </Text>
            <Text fontSize="lg" color="gray.600" mt={2}>
              Active Users
            </Text>
          </Box>
          <Box
            bg="pink.50"
            p={8}
            borderRadius="2xl"
            textAlign="center"
            boxShadow="0 4px 16px rgba(238, 63, 155, 0.1)"
          >
            <Text fontSize="4xl" fontWeight="bold" color="pink.600">
              10K+
            </Text>
            <Text fontSize="lg" color="gray.600" mt={2}>
              Matches Made
            </Text>
          </Box>
          <Box
            bg="pink.50"
            p={8}
            borderRadius="2xl"
            textAlign="center"
            boxShadow="0 4px 16px rgba(238, 63, 155, 0.1)"
          >
            <Text fontSize="4xl" fontWeight="bold" color="pink.600">
              4.8★
            </Text>
            <Text fontSize="lg" color="gray.600" mt={2}>
              User Rating
            </Text>
          </Box>
        </SimpleGrid>

        <Box w="100%" maxW="1000px" px={6}>
          <Text
            fontSize="3xl"
            fontWeight="bold"
            color="pink.600"
            textAlign="center"
            mb={10}
          >
            Why Choose LoveConnect?
          </Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={8}>
            <Flex
              bg="white"
              p={8}
              borderRadius="2xl"
              boxShadow="0 4px 20px rgba(0, 0, 0, 0.08)"
              gap={4}
              align="start"
            >
              <Box
                bg="pink.100"
                p={4}
                borderRadius="xl"
                color="pink.600"
                fontSize="2xl"
              >
                <Icon>
                  <FaHeart />
                </Icon>
              </Box>
              <Box>
                <Text fontSize="xl" fontWeight="bold" color="gray.800" mb={2}>
                  Smart Matching
                </Text>
                <Text color="gray.600">
                  Our advanced algorithm connects you with people who share your
                  interests, hobbies, and values for meaningful relationships.
                </Text>
              </Box>
            </Flex>

            <Flex
              bg="white"
              p={8}
              borderRadius="2xl"
              boxShadow="0 4px 20px rgba(0, 0, 0, 0.08)"
              gap={4}
              align="start"
            >
              <Box
                bg="pink.100"
                p={4}
                borderRadius="xl"
                color="pink.600"
                fontSize="2xl"
              >
                <Icon>
                  <FaShieldAlt />
                </Icon>
              </Box>
              <Box>
                <Text fontSize="xl" fontWeight="bold" color="gray.800" mb={2}>
                  Safe & Secure
                </Text>
                <Text color="gray.600">
                  Profile verification, secure messaging, and privacy controls
                  ensure a safe dating experience for all users.
                </Text>
              </Box>
            </Flex>

            <Flex
              bg="white"
              p={8}
              borderRadius="2xl"
              boxShadow="0 4px 20px rgba(0, 0, 0, 0.08)"
              gap={4}
              align="start"
            >
              <Box
                bg="pink.100"
                p={4}
                borderRadius="xl"
                color="pink.600"
                fontSize="2xl"
              >
                <Icon>
                  <FaUsers />
                </Icon>
              </Box>
              <Box>
                <Text fontSize="xl" fontWeight="bold" color="gray.800" mb={2}>
                  Local Connections
                </Text>
                <Text color="gray.600">
                  Find matches near you based on location and discover people in
                  your area looking for the same things you are.
                </Text>
              </Box>
            </Flex>

            <Flex
              bg="white"
              p={8}
              borderRadius="2xl"
              boxShadow="0 4px 20px rgba(0, 0, 0, 0.08)"
              gap={4}
              align="start"
            >
              <Box
                bg="pink.100"
                p={4}
                borderRadius="xl"
                color="pink.600"
                fontSize="2xl"
              >
                <Icon>
                  <FaComment />
                </Icon>
              </Box>
              <Box>
                <Text fontSize="xl" fontWeight="bold" color="gray.800" mb={2}>
                  Instant Messaging
                </Text>
                <Text color="gray.600">
                  Chat with your matches in real-time with our sleek messaging
                  system featuring photos, emojis, and more.
                </Text>
              </Box>
            </Flex>
          </SimpleGrid>
        </Box>

        <Box
          bg="linear-gradient(135deg, #f687b3 0%, #ed64a6 100%)"
          w="100%"
          py={16}
          px={6}
          borderRadius="3xl"
          maxW="1000px"
          textAlign="center"
          boxShadow="0 8px 32px rgba(238, 63, 155, 0.25)"
        >
          <Text fontSize="3xl" fontWeight="bold" color="white" mb={4}>
            Ready to Find Love?
          </Text>
          <Text fontSize="lg" color="white" opacity={0.9} mb={8}>
            Join LoveConnect today and start your journey to meaningful
            connections.
          </Text>
          <Button
            size="lg"
            bg="white"
            color="pink.600"
            borderRadius="full"
            px={12}
            py={6}
            fontSize="lg"
            fontWeight="bold"
            _hover={{
              transform: "translateY(-2px)",
              boxShadow: "0 8px 24px rgba(255, 255, 255, 0.3)",
            }}
            transition="all 0.2s"
          >
            Create Your Profile Now
          </Button>
        </Box>
      </VStack>
    </>
  );
};

export default HomePage;
