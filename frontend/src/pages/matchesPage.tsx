import React, { useState } from "react";
import {
  Box,
  VStack,
  Text,
  Tag,
  HStack,
  IconButton,
  Flex,
} from "@chakra-ui/react";
import { FaHeart, FaTimes, FaChevronRight } from "react-icons/fa";

const dummyData = [
  {
    image: "https://randomuser.me/api/portraits/women/79.jpg",
    name: "Emma",
    age: 26,
    location: "Los Angeles, CA",
    occupation: "Marketing Manager",
    university: "UCLA",
    description:
      "Beach lover 🏄‍♀️ | Fitness enthusiast | Dog mom to a golden retriever | Looking for my adventure partner",
    tags: ["Fitness", "Dogs", "Beach", "Marketing"],
  },
  {
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    name: "James",
    age: 29,
    location: "New York, NY",
    occupation: "Software Engineer",
    university: "NYU",
    description:
      "Tech geek 🤓 | Coffee lover | Gamer | Looking for someone to share adventures and code with",
    tags: ["Tech", "Gaming", "Coffee", "Coding"],
  },
  {
    image: "https://randomuser.me/api/portraits/women/65.jpg",
    name: "Sophia",
    age: 24,
    location: "Chicago, IL",
    occupation: "Graphic Designer",
    university: "SAIC",
    description:
      "Art lover 🎨 | Wine enthusiast | Avid reader | Seeking creativity and fun",
    tags: ["Art", "Wine", "Books", "Design"],
  },
];

interface TinderCardProps {
  image: string;
  name: string;
  age: number;
  location: string;
  occupation: string;
  university: string;
  description: string;
  tags: string[];
  onPass: () => void;
  onDecline: () => void;
  onAccept: () => void;
}

const TinderCard: React.FC<TinderCardProps> = ({
  image,
  name,
  age,
  location,
  occupation,
  university,
  description,
  tags,
  onPass,
  onDecline,
  onAccept,
}) => (
  <Flex
    direction="column"
    align="center"
    w={{ base: "100%", md: "370px" }}
    p={0}
    mx="auto"
    my={6}
  >
    <Box
      w="100%"
      h="520px"
      bg={`url(${image})`}
      bgSize="cover"
      borderRadius="2xl"
      boxShadow="0 6px 24px rgba(0,0,0,.13)"
      display="flex"
      alignItems="flex-end"
      justifyContent="center"
      overflow="hidden"
      position="relative"
    >
      <Box
        bg="rgba(30,30,40,0.62)"
        backdropFilter="blur(2.5px)"
        color="white"
        p={7}
        w="100%"
        borderBottomRadius="2xl"
      >
        <Text fontWeight="bold" fontSize="2xl">
          {name}, {age}
        </Text>
        <HStack mt={1}>
          <Text fontSize="sm" fontWeight="medium">
            {location}
          </Text>
          <Text fontSize="sm">{occupation}</Text>
          <Text fontSize="sm">{university}</Text>
        </HStack>
        <Text mt={3} fontSize="md">
          {description}
        </Text>
        <HStack mt={3}>
          {tags.map((tag) => (
            <Tag.Root key={tag} colorScheme="pink" size="md" variant="solid">
              <Tag.Label>{tag}</Tag.Label>
            </Tag.Root>
          ))}
        </HStack>
      </Box>
    </Box>
    <HStack mt={5}>
      <IconButton
        aria-label="Pass"
        size="lg"
        colorScheme="gray"
        onClick={onPass}
        borderRadius="full"
      >
        <FaTimes />
      </IconButton>
      <IconButton
        aria-label="Accept"
        size="lg"
        colorScheme="pink"
        onClick={onAccept}
        borderRadius="full"
      >
        <FaHeart />
      </IconButton>
      <IconButton
        aria-label="Decline"
        size="lg"
        colorScheme="purple"
        onClick={onDecline}
        borderRadius="full"
      >
        <FaChevronRight />
      </IconButton>
    </HStack>
  </Flex>
);

const HomePage: React.FC = () => {
  const [index, setIndex] = useState(0);

  const handleNext = () => {
    setIndex((prevIndex) => (prevIndex + 1) % dummyData.length);
  };

  return (
    <VStack>
      <Text fontSize="3xl" fontWeight="bold" color="pink.700" mt={8}>
        💗 LoveConnect
      </Text>
      <Text mt={2} color="gray.600">
        Find your perfect match
      </Text>
      <TinderCard
        {...dummyData[index]}
        onAccept={handleNext}
        onDecline={handleNext}
        onPass={handleNext}
      />
    </VStack>
  );
};

export default HomePage;
