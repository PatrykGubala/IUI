import React, { useState, useEffect, useRef } from "react";
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
    Spinner,
    Center,
} from "@chakra-ui/react";
import { FiSend } from "react-icons/fi";
import api from "../contexts/AxiosInstance";
import { toaster } from "../components/ui/toaster";

interface MatchItem {
    match_id: number;
    name: string;
    subtitle: string;
    time: string;
    message: string;
    avatar: string | null;
}

interface MessageItem {
    id: number;
    user: string;
    content: string;
    time: string;
    type: "incoming" | "outgoing";
    match_id?: number;
}

const ChatPage: React.FC = () => {
    const [input, setInput] = useState("");
    const [matches, setMatches] = useState<MatchItem[]>([]);
    const [activeMatchId, setActiveMatchId] = useState<number | null>(null);
    const [messages, setMessages] = useState<MessageItem[]>([]);
    const [isLoadingMatches, setIsLoadingMatches] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    const activeMatchIdRef = useRef<number | null>(null);
    const viewportRef = useRef<HTMLDivElement>(null);

    const activeMatch = matches.find((m) => m.match_id === activeMatchId);

    useEffect(() => {
        activeMatchIdRef.current = activeMatchId;
    }, [activeMatchId]);

    useEffect(() => {
        fetchMatches();

        const token = localStorage.getItem('access');
        const controller = new AbortController();

        const startGlobalStream = async () => {
            try {
                const response = await fetch(`http://localhost:8000/api/chat/stream/`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    signal: controller.signal,
                });

                if (!response.body) return;

                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const jsonStr = line.replace('data: ', '');
                            try {
                                const newMsg = JSON.parse(jsonStr);
                                handleIncomingMessage(newMsg);
                            } catch (e) {
                            }
                        }
                    }
                }
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    console.error("Stream error", err);
                }
            }
        };

        startGlobalStream();

        return () => {
            controller.abort();
        };
    }, []);
    useEffect(() => {
        if (activeMatchId) {
            fetchMessages(activeMatchId);
        } else {
            setMessages([]);
        }
    }, [activeMatchId]);

    useEffect(() => {
        if (viewportRef.current) {
            setTimeout(() => {
                viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
            }, 100)
        }
    }, [messages]);

    const handleIncomingMessage = (newMsg: any) => {
        const msgMatchId = newMsg.match_id;

        if (activeMatchIdRef.current === msgMatchId) {
            setMessages(prev => {
                if (prev.some(m => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
            });
        }

        setMatches(prevMatches => {
            const matchIndex = prevMatches.findIndex(m => m.match_id === msgMatchId);
            if (matchIndex === -1) return prevMatches;

            const updatedMatch = {
                ...prevMatches[matchIndex],
                message: newMsg.content,
                time: newMsg.time
            };

            const newMatches = [...prevMatches];
            newMatches.splice(matchIndex, 1);
            newMatches.unshift(updatedMatch);
            return newMatches;
        });
    };

    const fetchMatches = async () => {
        try {
            setIsLoadingMatches(true);
            const res = await api.get("dating/matches/");
            setMatches(res.data);
            if (res.data.length > 0 && !activeMatchIdRef.current) {
                setActiveMatchId(res.data[0].match_id);
            }
        } catch (err) {
            console.error(err);
            toaster.create({
                title: "Error fetching matches",
                type: "error",
            });
        } finally {
            setIsLoadingMatches(false);
        }
    };

    const fetchMessages = async (matchId: number) => {
        try {
            setIsLoadingMessages(true);
            const res = await api.get(`chat/${matchId}/messages/`);
            setMessages(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoadingMessages(false);
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || !activeMatchId) return;

        const tempInput = input;
        setInput("");

        try {
            const res = await api.post(`chat/${activeMatchId}/messages/`, {
                content: tempInput,
            });

            const sentMsg = res.data;
            sentMsg.match_id = activeMatchId;
            handleIncomingMessage(sentMsg);

        } catch (err) {
            console.error(err);
            toaster.create({
                title: "Failed to send message",
                type: "error",
            });
            setInput(tempInput);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSendMessage();
        }
    };

    return (
        <Flex gap={10} direction={{ base: "column", md: "row" }} h="85vh">
            <Box
                minW={{ base: "100%", md: "320px" }}
                bg="pink.50"
                borderRadius="2xl"
                p={6}
                display="flex"
                flexDirection="column"
            >
                <Text fontWeight="bold" color="pink.700" fontSize="lg" mb={2}>
                    ACTIVE CHATS
                </Text>
                <Text fontWeight="600" fontSize="xl" mb={5}>
                    Your Matches
                </Text>

                {isLoadingMatches ? (
                    <Center flex="1">
                        <Spinner color="pink.500" />
                    </Center>
                ) : (
                    <VStack align="stretch" mb={6} overflowY="auto" flex="1">
                        {matches.length === 0 ? (
                            <Text color="gray.500" textAlign="center" mt={4}>No matches yet.</Text>
                        ) : (
                            matches.map((match) => (
                                <Flex
                                    key={match.match_id}
                                    align="center"
                                    bg={activeMatchId === match.match_id ? "white" : "transparent"}
                                    cursor="pointer"
                                    p={3}
                                    borderRadius="xl"
                                    boxShadow={
                                        activeMatchId === match.match_id
                                            ? "0 2px 8px rgba(238, 63, 155, 0.1)"
                                            : "none"
                                    }
                                    border={
                                        activeMatchId === match.match_id ? "2px solid #f9c3eb" : "none"
                                    }
                                    gap={4}
                                    onClick={() => setActiveMatchId(match.match_id)}
                                    transition="background 0.2s, box-shadow 0.2s"
                                    _hover={{ bg: "pink.100" }}
                                >
                                    <Avatar.Root>
                                        <Avatar.Fallback name={match.name} />
                                        <Avatar.Image src={match.avatar || ""} />
                                    </Avatar.Root>
                                    <Box flex="1" overflow="hidden">
                                        <Text fontWeight="bold" color="pink.900" fontSize="md" truncate>
                                            {match.name}
                                        </Text>
                                        <Text fontSize="sm" color="pink.500" truncate>
                                            {match.subtitle}
                                        </Text>
                                        <Text fontSize="sm" color="gray.600" mt={1} truncate>
                                            {match.message}
                                        </Text>
                                    </Box>
                                    <Text fontSize="xs" color="pink.400" whiteSpace="nowrap">
                                        {match.time}
                                    </Text>
                                </Flex>
                            ))
                        )}
                    </VStack>
                )}
            </Box>

            <Box flex="1" bg="pink.50" borderRadius="2xl" p={6} display="flex" flexDirection="column">
                {activeMatch ? (
                    <>
                        <Flex align="center" justify="space-between" mb={2} gap={3}>
                            <Flex align="center" gap={3}>
                                <Avatar.Root>
                                    <Avatar.Fallback name={activeMatch.name} />
                                    <Avatar.Image src={activeMatch.avatar || ""} />
                                </Avatar.Root>
                                <Text fontWeight="bold" fontSize="xl">
                                    {activeMatch.name}
                                </Text>
                            </Flex>
                        </Flex>
                        <Text fontSize="sm" color="gray.500" mb={4}>
                            Keep the conversation going!
                        </Text>

                        <ScrollArea.Root
                            flex="1"
                            borderRadius="2xl"
                            type="always"
                        >
                            <ScrollArea.Viewport
                                ref={viewportRef}
                                style={{ height: "100%" }}
                                css={{
                                    "& > div": {
                                        display: "block !important"
                                    }
                                }}
                            >
                                <ScrollArea.Content>
                                    <VStack align="stretch" gap={3} pb={4}>
                                        {isLoadingMessages && messages.length === 0 && (
                                            <Center py={10}><Spinner color="pink.500" /></Center>
                                        )}
                                        {!isLoadingMessages && messages.length === 0 && (
                                            <Text textAlign="center" color="gray.400" mt={10}>
                                                Say hello to start the conversation! 👋
                                            </Text>
                                        )}
                                        {messages.map((msg) => (
                                            <Flex
                                                key={msg.id}
                                                align={msg.type === "outgoing" ? "flex-end" : "flex-start"}
                                                justify={msg.type === "outgoing" ? "flex-end" : "flex-start"}
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
                                                        textAlign="right"
                                                    >
                                                        {msg.time}
                                                    </Text>
                                                </Box>
                                            </Flex>
                                        ))}
                                    </VStack>
                                </ScrollArea.Content>
                            </ScrollArea.Viewport>
                            <ScrollArea.Scrollbar orientation="vertical">
                                <ScrollArea.Thumb bg="pink.300" />
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
                                placeholder="Type a message..."
                                border="none"
                                _focus={{ boxShadow: "none" }}
                                fontSize="md"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                                bg="transparent"
                                flex="1"
                            />

                            <IconButton
                                aria-label="Send"
                                colorScheme="pink"
                                borderRadius="full"
                                ml={2}
                                onClick={handleSendMessage}
                                disabled={!input.trim()}
                            >
                                <FiSend />
                            </IconButton>
                        </Flex>
                    </>
                ) : (
                    <Center flex="1" flexDirection="column">
                        <Text fontSize="xl" fontWeight="bold" color="pink.300">Select a match to start chatting</Text>
                    </Center>
                )}
            </Box>
        </Flex>
    );
};

export default ChatPage;