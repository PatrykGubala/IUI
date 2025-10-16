import React, { useState } from "react";
import {
  Box,
  Flex,
  Input,
  Text,
  VStack,
  Button,
  IconButton,
  ScrollArea,
  Avatar,
} from "@chakra-ui/react";
import { FiSend } from "react-icons/fi";

const activeChats = [
  {
    name: "Zara",
    subtitle: "Dreamy Adventurer",
    time: "2m ago",
    message: "I picked out a rooftop cinema for us!",
    avatar: "https://randomuser.me/api/portraits/women/79.jpg",
    messages: [
      {
        user: "Zara",
        time: "19:21",
        content:
          "I booked that rooftop cinema for Saturday. Should we bring blankets or rely on snuggling?",
        type: "incoming",
      },
      {
        user: "You",
        time: "19:22",
        content:
          "Let's do both! I'll handle snacks if you pick the soundtrack for the walk home.",
        type: "outgoing",
      },
      {
        user: "Zara",
        time: "19:25",
        content:
          "Deal. How do you feel about a late-night gelato detour afterwards?",
        type: "incoming",
      },
      {
        user: "Zara",
        time: "19:25",
        content:
          "Deal. How do you feel about a late-night gelato detour afterwards?",
        type: "incoming",
      },
      {
        user: "Zara",
        time: "19:25",
        content:
          "Deal. How do you feel about a late-night gelato detour afterwards?",
        type: "incoming",
      },
    ],
  },
  {
    name: "Noah",
    subtitle: "Thoughtful Explorer",
    time: "1h ago",
    message: "Sending you my favourite indie film list",
    avatar: "https://randomuser.me/api/portraits/men/34.jpg",
    messages: [
      {
        user: "Noah",
        time: "18:42",
        content: "Hey! Sending you my favourite indie film list.",
        type: "incoming",
      },
      {
        user: "You",
        time: "18:44",
        content: "Thanks! I'll watch some of them this weekend.",
        type: "outgoing",
      },
    ],
  },
  {
    name: "Ren",
    subtitle: "Tea ceremony curator",
    time: "Yesterday",
    message: "I found a hidden sunrise hike",
    avatar: "https://randomuser.me/api/portraits/men/12.jpg",
    messages: [
      {
        user: "Ren",
        time: "14:30",
        content: "I found a hidden sunrise hike spot.",
        type: "incoming",
      },
      {
        user: "You",
        time: "15:10",
        content: "Sounds magical, let's try this weekend?",
        type: "outgoing",
      },
    ],
  },
];

const promptText =
  "Romantic prompt: share the song that instantly reminds you of romance and ask for theirs.";

const ChatPage: React.FC = () => {
  const [input, setInput] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);

  const chat = activeChats[activeIdx];

  return (
    <Flex gap={10} direction={{ base: "column", md: "row" }}>
      <Box
        minW={{ base: "100%", md: "320px" }}
        bg="pink.50"
        borderRadius="2xl"
        p={6}
      >
        <Text fontWeight="bold" color="pink.700" fontSize="lg" mb={2}>
          ACTIVE CHATS
        </Text>
        <Text fontWeight="600" fontSize="xl" mb={5}>
          Conversations you’re nurturing
        </Text>
        <VStack align="stretch" mb={6}>
          {activeChats.map((chatItem, idx) => (
            <Flex
              key={chatItem.name}
              align="center"
              bg={activeIdx === idx ? "white" : "transparent"}
              cursor="pointer"
              p={3}
              borderRadius="xl"
              boxShadow={
                activeIdx === idx ? "0 2px 8px rgba(238, 63, 155, 0.1)" : "none"
              }
              border={activeIdx === idx ? "2px solid #f9c3eb" : "none"}
              gap={4}
              onClick={() => setActiveIdx(idx)}
              transition="background 0.2s, box-shadow 0.2s"
              _hover={{ bg: "pink.100" }}
            >
              <Avatar.Root>
                <Avatar.Fallback name={chatItem.name} />
                <Avatar.Image src={chatItem.avatar} />
              </Avatar.Root>
              <Box flex="1">
                <Text fontWeight="bold" color="pink.900" fontSize="md">
                  {chatItem.name}
                </Text>
                <Text fontSize="sm" color="pink.500">
                  {chatItem.subtitle}
                </Text>
                <Text fontSize="sm" color="gray.600" mt={1}>
                  {chatItem.message}
                </Text>
              </Box>
              <Text fontSize="xs" color="pink.400">
                {chatItem.time}
              </Text>
            </Flex>
          ))}
        </VStack>
        <Box
          bg="pink.100"
          borderRadius="lg"
          p={3}
          color="pink.700"
          fontSize="sm"
        >
          {promptText}
        </Box>
      </Box>

      <Box flex="1" bg="pink.50" borderRadius="2xl" p={6}>
        <Flex align="center" justify="space-between" mb={2} gap={3}>
          <Flex align="center" gap={3}>
            <Avatar.Root>
              <Avatar.Fallback name={chat.name} />
              <Avatar.Image src={chat.avatar} />
            </Avatar.Root>
            <Text fontWeight="bold" fontSize="xl">
              {chat.name}
            </Text>
          </Flex>
          <Button
            colorScheme="pink"
            variant="ghost"
            borderRadius="full"
            fontWeight="600"
          >
            Plan a date
          </Button>
        </Flex>
        <Text fontSize="sm" color="gray.500" mb={4}>
          Typing thoughtful replies keeps your spark counter glowing.
        </Text>

        <ScrollArea.Root height="24rem" borderRadius="2xl">
          <ScrollArea.Viewport
            css={{
              "--scroll-shadow-size": "2rem",
              maskImage:
                "linear-gradient(#000,#000,transparent 0,#000 var(--scroll-shadow-size),#000 calc(100% - var(--scroll-shadow-size)),transparent)",
              "&[data-at-top]": {
                maskImage:
                  "linear-gradient(180deg,#000 calc(100% - var(--scroll-shadow-size)),transparent)",
              },
              "&[data-at-bottom]": {
                maskImage:
                  "linear-gradient(0deg,#000 calc(100% - var(--scroll-shadow-size)),transparent)",
              },
            }}
            px={0}
          >
            <ScrollArea.Content>
              <VStack align="stretch">
                {chat.messages.map((msg, idx) => (
                  <Flex
                    key={idx}
                    align={msg.type === "outgoing" ? "flex-end" : "flex-start"}
                    justify={
                      msg.type === "outgoing" ? "flex-end" : "flex-start"
                    }
                  >
                    <Box
                      bg={msg.type === "outgoing" ? "pink.400" : "pink.100"}
                      color={msg.type === "outgoing" ? "white" : "pink.900"}
                      py={3}
                      px={5}
                      borderRadius="2xl"
                      maxW="70%"
                      fontWeight="500"
                      fontSize="md"
                      boxShadow="0 2px 8px rgba(238, 63, 155, 0.05)"
                    >
                      {msg.content}
                      <Text
                        mt={2}
                        fontSize="xs"
                        color={
                          msg.type === "outgoing"
                            ? "whiteAlpha.800"
                            : "pink.400"
                        }
                      >
                        {msg.user} • {msg.time}
                      </Text>
                    </Box>
                  </Flex>
                ))}
              </VStack>
            </ScrollArea.Content>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar>
            <ScrollArea.Thumb
              bg="pink.200"
              _hover={{ bg: "pink.300" }}
              borderRadius="full"
            />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>

        <Flex
          align="center"
          bg="white"
          borderRadius="2xl"
          p={4}
          boxShadow="0 2px 8px rgba(238, 63, 155, 0.10)"
          mt={4}
        >
          <Input
            placeholder="Compose a note that feels like a scene from your favorite romance…"
            border="none"
            _focus={{ boxShadow: "none" }}
            fontSize="md"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            bg="transparent"
            flex="1"
          />

          <IconButton
            aria-label="Send"
            colorScheme="pink"
            borderRadius="full"
            ml={2}
          >
            <FiSend />
          </IconButton>
        </Flex>
      </Box>
    </Flex>
  );
};

export default ChatPage;
