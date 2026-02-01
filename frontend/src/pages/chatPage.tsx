import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    Box, Flex, Input, Text, VStack, IconButton,
    ScrollArea, Avatar, Spinner, Center,
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
    user_name: string;
    content: string;
    time: string;
    type: "incoming" | "outgoing";
    match_id?: number;
}

const useChatStream = (token: string | null, onMessage: (msg: MessageItem) => void) => {
    useEffect(() => {
        if (!token) return;
        const controller = new AbortController();

        const connect = async () => {
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
                    chunk.split('\n\n').forEach(line => {
                        if (line.startsWith('data: ')) {
                            try {
                                const newMsg = JSON.parse(line.replace('data: ', ''));
                                onMessage(newMsg);
                            } catch (e) { }
                        }
                    });
                }
            } catch (err: unknown) {
                if (err instanceof Error && err.name !== 'AbortError') {
                    console.error(err);
                }
            }
        };
        connect();
        return () => controller.abort();
    }, [token, onMessage]);
};

const ChatList: React.FC<{
    matches: MatchItem[];
    activeId: number | null;
    onSelect: (id: number) => void;
    isLoading: boolean;
}> = ({ matches, activeId, onSelect, isLoading }) => {
    if (isLoading) {
        return <Center flex="1"><Spinner color="pink.500" /></Center>;
    }

    if (matches.length === 0) {
        return <Text color="gray.500" textAlign="center" mt={4}>No matches yet.</Text>;
    }

    return (
        <VStack align="stretch" mb={6} overflowY="auto" flex="1">
            {matches.map((match) => (
                <Flex
                    key={match.match_id}
                    align="center"
                    bg={activeId === match.match_id ? "white" : "transparent"}
                    cursor="pointer"
                    p={3}
                    borderRadius="xl"
                    boxShadow={activeId === match.match_id ? "0 2px 8px rgba(238, 63, 155, 0.1)" : "none"}
                    border={activeId === match.match_id ? "2px solid #f9c3eb" : "none"}
                    gap={4}
                    onClick={() => onSelect(match.match_id)}
                    _hover={{ bg: "pink.100" }}
                >
                    <Avatar.Root>
                        <Avatar.Fallback name={match.name} />
                        <Avatar.Image src={match.avatar || ""} />
                    </Avatar.Root>
                    <Box flex="1" overflow="hidden">
                        <Text fontWeight="bold" color="pink.900" fontSize="md" truncate>{match.name}</Text>
                        <Text fontSize="sm" color="pink.500" truncate>{match.subtitle}</Text>
                        <Text fontSize="sm" color="gray.600" mt={1} truncate>{match.message}</Text>
                    </Box>
                    <Text fontSize="xs" color="pink.400" whiteSpace="nowrap">{match.time}</Text>
                </Flex>
            ))}
        </VStack>
    );
};

const ChatWindow: React.FC<{
    match: MatchItem | undefined;
    messages: MessageItem[];
    isLoading: boolean;
    onSend: (text: string) => void;
}> = ({ match, messages, isLoading, onSend }) => {
    const [input, setInput] = useState("");
    const viewportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (viewportRef.current) {
            setTimeout(() => {
                viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
            }, 100);
        }
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        onSend(input);
        setInput("");
    };

    if (!match) {
        return (
            <Center flex="1" flexDirection="column">
                <Text fontSize="xl" fontWeight="bold" color="pink.300">Select a match to start chatting</Text>
            </Center>
        );
    }

    return (
        <>
            <Flex align="center" justify="space-between" mb={2} gap={3}>
                <Flex align="center" gap={3}>
                    <Avatar.Root>
                        <Avatar.Fallback name={match.name} />
                        <Avatar.Image src={match.avatar || ""} />
                    </Avatar.Root>
                    <Text fontWeight="bold" fontSize="xl">{match.name}</Text>
                </Flex>
            </Flex>
            <Text fontSize="sm" color="gray.500" mb={4}>Keep the conversation going!</Text>

            <ScrollArea.Root flex="1" borderRadius="2xl" type="always">
                <ScrollArea.Viewport ref={viewportRef} style={{ height: "100%" }} css={{ "& > div": { display: "block !important" } }}>
                    <ScrollArea.Content>
                        {/* Added pr={4} to fix scroll overlap */}
                        <VStack align="stretch" gap={3} pb={4} pr={4}>
                            {isLoading && messages.length === 0 && <Center py={10}><Spinner color="pink.500" /></Center>}
                            {!isLoading && messages.length === 0 && (
                                <Text textAlign="center" color="gray.400" mt={10}>Say hello to start the conversation! 👋</Text>
                            )}
                            {messages.map((msg) => (
                                <Flex key={msg.id} justify={msg.type === "outgoing" ? "flex-end" : "flex-start"}>
                                    <Box
                                        bg={msg.type === "outgoing" ? "pink.400" : "pink.100"}
                                        color={msg.type === "outgoing" ? "white" : "pink.900"}
                                        py={3} px={5} borderRadius="2xl" maxW="70%"
                                        fontWeight="500" fontSize="md" boxShadow="0 2px 8px rgba(238, 63, 155, 0.05)"
                                    >
                                        {msg.content}
                                        <Text mt={2} fontSize="xs" color={msg.type === "outgoing" ? "whiteAlpha.800" : "pink.400"} textAlign="right">
                                            {msg.time}
                                        </Text>
                                    </Box>
                                </Flex>
                            ))}
                        </VStack>
                    </ScrollArea.Content>
                </ScrollArea.Viewport>
                <ScrollArea.Scrollbar orientation="vertical"><ScrollArea.Thumb bg="pink.300" /></ScrollArea.Scrollbar>
            </ScrollArea.Root>

            <Flex align="center" bg="white" borderRadius="2xl" p={4} boxShadow="0 2px 8px rgba(238, 63, 155, 0.10)" mt={4}>
                <Input
                    placeholder="Type a message..."
                    border="none" _focus={{ boxShadow: "none" }} fontSize="md" bg="transparent" flex="1"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <IconButton aria-label="Send" colorScheme="pink" borderRadius="full" ml={2} onClick={handleSend} disabled={!input.trim()}>
                    <FiSend />
                </IconButton>
            </Flex>
        </>
    );
};

const ChatPage: React.FC = () => {
    const [matches, setMatches] = useState<MatchItem[]>([]);
    const [activeMatchId, setActiveMatchId] = useState<number | null>(null);
    const [messages, setMessages] = useState<MessageItem[]>([]);
    const [isLoadingMatches, setIsLoadingMatches] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    const activeMatch = matches.find((m) => m.match_id === activeMatchId);

    const updateMatchPreview = useCallback((newMsg: MessageItem) => {
        setMatches(prevMatches => {
            const index = prevMatches.findIndex(m => m.match_id === newMsg.match_id);
            if (index === -1) return prevMatches;

            const updated = { ...prevMatches[index], message: newMsg.content, time: newMsg.time };
            const newList = [...prevMatches];
            newList.splice(index, 1);
            newList.unshift(updated);
            return newList;
        });
    }, []);

    const handleIncomingMessage = useCallback((newMsg: MessageItem) => {
        if (!newMsg.match_id) return;

        setMessages(prev => {
            if (activeMatchId === newMsg.match_id && !prev.some(m => m.id === newMsg.id)) {
                return [...prev, newMsg];
            }
            return prev;
        });
        updateMatchPreview(newMsg);
    }, [activeMatchId, updateMatchPreview]);

    useChatStream(localStorage.getItem('access'), handleIncomingMessage);

    useEffect(() => {
        const fetchMatches = async () => {
            setIsLoadingMatches(true);
            try {
                const res = await api.get("dating/matches/");
                setMatches(res.data);
                if (res.data.length > 0 && !activeMatchId) setActiveMatchId(res.data[0].match_id);
            } catch (error) {
                toaster.create({ title: "Error fetching matches", type: "error" });
            } finally {
                setIsLoadingMatches(false);
            }
        };
        fetchMatches();
    }, []);

    useEffect(() => {
        if (!activeMatchId) return setMessages([]);

        const fetchMessages = async () => {
            setIsLoadingMessages(true);
            try {
                const res = await api.get(`chat/${activeMatchId}/messages/`);
                setMessages(res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoadingMessages(false);
            }
        };
        fetchMessages();
    }, [activeMatchId]);

    const handleSendMessage = async (text: string) => {
        if (!activeMatchId) return;
        try {
            const res = await api.post(`chat/${activeMatchId}/messages/`, { content: text });
            const sentMsg = { ...res.data, match_id: activeMatchId };
            handleIncomingMessage(sentMsg);
        } catch (error) {
            toaster.create({ title: "Failed to send message", type: "error" });
        }
    };

    return (
        <Flex gap={10} direction={{ base: "column", md: "row" }} h="85vh">
            <Box minW={{ base: "100%", md: "320px" }} bg="pink.50" borderRadius="2xl" p={6} display="flex" flexDirection="column">
                <Text fontWeight="bold" color="pink.700" fontSize="lg" mb={2}>ACTIVE CHATS</Text>
                <Text fontWeight="600" fontSize="xl" mb={5}>Your Matches</Text>
                <ChatList matches={matches} activeId={activeMatchId} onSelect={setActiveMatchId} isLoading={isLoadingMatches} />
            </Box>

            <Box flex="1" bg="pink.50" borderRadius="2xl" p={6} display="flex" flexDirection="column">
                <ChatWindow match={activeMatch} messages={messages} isLoading={isLoadingMessages} onSend={handleSendMessage} />
            </Box>
        </Flex>
    );
};

export default ChatPage;