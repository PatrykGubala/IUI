import React, { useEffect, useState } from "react";
import {
  Box,
  VStack,
  Text,
  Tag,
  HStack,
  IconButton,
  Flex,
  Center,
  Spinner,
} from "@chakra-ui/react";
import { FaHeart, FaTimes, FaChevronRight } from "react-icons/fa";
import { toaster } from "./../components/ui/toaster";
import api from "./../contexts/AxiosInstance.ts";
import type { FeedItem, FeedUser } from "../types/types";

type SwipeAction = "LIKE" | "PASS";

interface SwipeResponse {
  is_match: boolean;
}

const IMAGE_PLACEHOLDER =
    "https://upload.wikimedia.org/wikipedia/commons/a/a2/Person_Image_Placeholder.png" as const;

const DATING_FEED_ENDPOINT = "dating/feed/";
const DATING_SWIPE_ENDPOINT = "dating/swipe/";


const normalizeFeedUser = (item: FeedItem): FeedUser => {
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

const sendSwipe = async (
    targetId: number,
    action: SwipeAction
): Promise<SwipeResponse> => {
  const res = await api.post<SwipeResponse>(DATING_SWIPE_ENDPOINT, {
    target_id: targetId,
    action,
  });

  return res.data;
};


const useDatingFeed = () => {
  const [matches, setMatches] = useState<FeedUser[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get<FeedItem[]>(DATING_FEED_ENDPOINT);
        const normalized = response.data.map(normalizeFeedUser);

        setMatches(normalized);
        setCurrentIndex(0);
      } catch (err) {
        console.error(err);
        setError("Nie udało się pobrać dopasowań. Spróbuj ponownie.");
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, []);

  const removeCurrentMatch = () => {
    setMatches((prev) => {
      if (!prev.length) return prev;

      const updated = prev.filter((_, i) => i !== currentIndex);
      const nextIndex = Math.min(currentIndex, Math.max(updated.length - 1, 0));

      setCurrentIndex(nextIndex);
      return updated;
    });
  };

  const goToNextMatch = () => {
    setCurrentIndex((prevIndex) =>
        matches.length ? (prevIndex + 1) % matches.length : 0
    );
  };

  const currentMatch = matches[currentIndex] ?? null;

  return {
    matches,
    currentMatch,
    currentIndex,
    loading,
    error,
    removeCurrentMatch,
    goToNextMatch,
  };
};


interface TinderCardProps extends FeedUser {
  onLike: () => void;
  onPass: () => void;
  onSkip: () => void;
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
                                                 onLike,
                                                 onPass,
                                                 onSkip,
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
            aria-label="Pass"
            size="lg"
            colorScheme="gray"
            onClick={onPass}
            borderRadius="full"
        >
          <FaTimes />
        </IconButton>
        <IconButton
            aria-label="Like"
            size="lg"
            colorScheme="pink"
            onClick={onLike}
            borderRadius="full"
        >
          <FaHeart />
        </IconButton>
        <IconButton
            aria-label="Skip"
            size="lg"
            colorScheme="purple"
            onClick={onSkip}
            borderRadius="full"
        >
          <FaChevronRight />
        </IconButton>
      </HStack>
    </Flex>
);


const HomePage: React.FC = () => {
  const {
    currentMatch,
    loading,
    error,
    matches,
    removeCurrentMatch,
    goToNextMatch,
  } = useDatingFeed();

  const handleSwipe = async (action: SwipeAction) => {
    if (!currentMatch) return;

    try {
      const data = await sendSwipe(currentMatch.id, action);

      if (data.is_match && action === "LIKE") {
        toaster.create({
          title: "It's a match! 🎉",
          description: "You and this user like each other.",
          type: "success",
        });
      }

      removeCurrentMatch();
    } catch (err) {
      console.error(err);
      toaster.create({
        title: "Swipe failed",
        description: "Try again later.",
        type: "error",
      });
    }
  };

  if (loading) {
    return (
        <Center minH="60vh">
          <Spinner size="xl" color="pink.500" />
        </Center>
    );
  }

  if (error) {
    return (
        <Center minH="60vh">
          <Text fontSize="lg" color="red.500">
            {error}
          </Text>
        </Center>
    );
  }

  if (!matches.length || !currentMatch) {
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
            {...currentMatch}
            onLike={() => handleSwipe("LIKE")}
            onPass={() => handleSwipe("PASS")}
            onSkip={goToNextMatch}
        />
      </VStack>
  );
};

export default HomePage;
