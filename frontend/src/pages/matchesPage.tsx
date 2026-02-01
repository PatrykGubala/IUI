import React, {useEffect, useState} from "react";
import {
  Box,
  VStack,
  Text,
  Tag,
  HStack,
  IconButton,
  Flex, Center, Spinner,
} from "@chakra-ui/react";
import { FaHeart, FaTimes, FaChevronRight } from "react-icons/fa";
import { toaster } from "./../components/ui/toaster";
import api from "./../contexts/AxiosInstance.ts";


const IMAGE_PLACEHOLDER = "https://upload.wikimedia.org/wikipedia/commons/a/a2/Person_Image_Placeholder.png" as const;

type FeedItem = {
  common: number,
  cosine: number,
  score: number,
  user: {
    id: number,
    image: string;
    firstName: string;
    lastName: string;
    age: number;
    location: string;
    occupation: string;
    university: string;
    description: string;
    tags: string[];
  }
}

type MatchCard = {
  id: number,
  image: string;
  firstName: string;
  lastName: string;
  age: number;
  location: string;
  occupation: string;
  university: string;
  description: string;
  tags: string[];
}

interface TinderCardProps extends MatchCard{

  onPass: () => void;
  onDecline: () => void;
  onAccept: () => void;
}

const TinderCard: React.FC<TinderCardProps> = ({
  image,
  firstName,
  lastName,
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
          {firstName} {lastName}, {age}
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
        aria-label="Decline"
        size="lg"
        colorScheme="gray"
        onClick={onDecline}
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
        aria-label="Pass"
        size="lg"
        colorScheme="purple"
        onClick={onPass}
        borderRadius="full"
      >
        <FaChevronRight />
      </IconButton>
    </HStack>
  </Flex>
);

const HomePage: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [matches, setMatches] = useState<MatchCard[]>([]);

  const [loading, setLoading] = useState(true);


  const handleNext = () => {
    setIndex((prevIndex) => (prevIndex + 1) % matches.length);
  };

  const sendSwipe = async (targetId: number, action: "LIKE" | "PASS") => {
    try {
      const res = await api.post("dating/swipe/", {
        target_id: targetId,
        action
      });

      if(res.data.is_match) {
        toaster.create({
          title: "It's a match! 🎉",
          description: "You and this user like each other.",
          type: "success",
        });
      }
    } catch (err) {
      console.error(err);
      toaster.create({
        title: "Swipe failed",
        description: "Try again later.",
        type: "error",
      });
    }
  };

  const handleSwipe = async (action: "LIKE" | "PASS") => {
    setMatches((prev) => {
      const current = prev[index];
      if(!current) return;

      sendSwipe(current.id, action);

      const updated = [...prev];
      updated.splice(index,1);

      const newIndex = Math.min(index, Math.max(updated.length-1,0));
      setIndex(newIndex);

      return updated;
    });
  }

  const normalizeFeedItem = (item: FeedItem): MatchCard => {
    const u = item.user;

    return {
      id: u.id,
      image: u.image ?? IMAGE_PLACEHOLDER,
      firstName: u.firstName ?? "unknown",
      lastName: u.lastName ?? "unknown",
      age: u.age ?? 0,
      location: u.location ?? "",
      occupation: u.occupation ?? "",
      university: u.university ?? "",
      description: u.description ?? "",
      tags: Array.isArray(u.tags) ? u.tags : [],
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const matchResponse = await api.get<FeedItem[]>('dating/feed/');

        setMatches(matchResponse.data.map(normalizeFeedItem));
        setIndex(0);
      } catch (err) {
        console.error(err);

      } finally {
        setLoading(false)
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
        <Center minH="60vh">
          <Spinner size="xl" color="pink.500" />
        </Center>
    );
  }

  if (!matches.length) {
    return (
        <Center minH="60vh">
          <Text fontSize="lg" color="gray.600">
            Na razie brak dopasowań. Spróbuj później. 💔
          </Text>
        </Center>
    );
  }

  return (
    <VStack>
      <Text fontSize="3xl" fontWeight="bold" color="pink.700" mt={8}>
        💗 LoveConnect
      </Text>
      <Text mt={2} color="gray.600">
        Find your perfect match
      </Text>
      <TinderCard
        {...matches[index]}
        onAccept={() => handleSwipe("LIKE")}
        onDecline={() => handleSwipe("PASS")}
        onPass={handleNext}
      />
    </VStack>
  );
};

export default HomePage;
