import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {useAuth} from "../../contexts/AuthContext.tsx";
import { Box, Flex, Button, Text } from "@chakra-ui/react";

const NAV_ITEMS = [
  { label: "Home", key: "home" },
  { label: "Matches", key: "matches" },
  { label: "Chat", key: "chat" },
];

const pastelShadow =
    "0 4px 24px 0px rgba(238, 63, 155, 0.10), 0 1.5px 12px 0px rgba(238,63,155,0.06)";
const pastelBorder = "2px solid #f9c3eb";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {isAuthenticated, logout} = useAuth();
  const active =
      location.pathname === "/" ? "home" : location.pathname.slice(1);


  const handleNavClick = (key: string) => {
      if(!isAuthenticated && (key === "matches" || key === "chat")){
          navigate('/login');
          return;
      }
      navigate(key === "home" ? "/" : `/${key}`);
  }

  return (
      <Flex
          as="nav"
          align="center"
          justify="space-between"
          bg="rgba(255, 255, 255, 0.95)"
          backdropFilter="blur(10px)"
          borderRadius="2xl"
          p={6}
          m={6}
          boxShadow={pastelShadow}
          border={pastelBorder}
          width="70%"
          maxW="1200px"
          mb={8}
      >
        <Flex align="center" gap={4}>
          <Text fontWeight="bold" fontSize="xl" color="pink.600">
            Heartline
          </Text>
          {/*<Text fontSize="sm" color="black" fontWeight="500" opacity={0.7}>*/}
          {/*  Where every match feels like destiny*/}
          {/*</Text>*/}
        </Flex>
        <Flex gap={3}>
          {NAV_ITEMS.map(({ label, key }) => (
              <Button
                  key={key}
                  borderRadius="full"
                  fontWeight="600"
                  fontSize="md"
                  px={6}
                  variant={active === key ? "solid" : "ghost"}
                  colorScheme="pink"
                  bg={active === key ? "pink.400" : "transparent"}
                  color={active === key ? "white" : "pink.700"}
                  boxShadow={active === key ? pastelShadow : "none"}
                  _hover={{
                    bg: active === key ? "pink.400" : "pink.50",
                    color: active === key ? "white" : "pink.700",
                  }}
                  onClick={() => handleNavClick(key)}
              >
                {label}
              </Button>
          ))}

          {!isAuthenticated ? (
              <Button
                  borderRadius="full"
                  fontWeight="600"
                  fontSize="md"
                  px={6}
                  variant={active === "profile" ? "solid" : "ghost"}
                  colorScheme="pink"
                  bg={active === "profile" ? "pink.400" : "transparent"}
                  color={active === "profile" ? "white" : "pink.700"}
                  boxShadow={active === "profile" ? pastelShadow : "none"}
                  _hover={{
                    bg: active === "profile" ? "pink.400" : "pink.50",
                    color: active === "profile" ? "white" : "pink.700",
                  }}
                  onClick={() => navigate("/login")}
              >
                Login
              </Button>
          ) : (
              <Flex gap={2}>
                <Button
                    borderRadius="full"
                    fontWeight="600"
                    fontSize="md"
                    px={6}
                    variant={active === "profile" ? "solid" : "ghost"}
                    colorScheme="pink"
                    bg={active === "profile" ? "pink.400" : "transparent"}
                    color={active === "profile" ? "white" : "pink.700"}
                    boxShadow={active === "profile" ? pastelShadow : "none"}
                    _hover={{
                      bg: active === "profile" ? "pink.400" : "pink.50",
                      color: active === "profile" ? "white" : "pink.700",
                    }}
                    onClick={() => navigate("/profile")}
                >
                  Profile
                </Button>
                <Button
                    borderRadius="full"
                    fontWeight="500"
                    px={4}
                    variant="ghost"
                    colorScheme="pink"
                    onClick={logout}
                >
                  Logout
                </Button>
              </Flex>
          )}
        </Flex>
      </Flex>
  );
};

const Tile = ({ children }: { children: React.ReactNode }) => (
    <Box
        bg="rgba(255, 255, 255, 0.98)"
        borderRadius="2xl"
        px={{ base: 5, md: 10 }}
        py={{ base: 7, md: 12 }}
        boxShadow={pastelShadow}
        border={pastelBorder}
        maxW="100%"
        width="100%"
        mt={0}
        mb={8}
        color="gray"
    >
      {children}
    </Box>
);

const Footer = () => (
    <Box
        as="footer"
        mt={2}
        mb={4}
        px={6}
        py={4}
        borderRadius="2xl"
        width="100%"
        bg="rgba(255, 255, 255, 0.95)"
        textAlign="center"
        fontSize="sm"
        color="gray.700"
        boxShadow={pastelShadow}
        border={pastelBorder}
    >
      © 2025 Heartline. Carefully crafted connections for modern romantics.
    </Box>
);

const HomePage = ({ children }: { children: React.ReactNode }) => (
    <Box
        minH="100vh"
        bgGradient="to-br"
        gradientFrom="#fbe5ef"
        gradientVia="#f9c3eb"
        gradientTo="#fff"
        display="flex"
        flexDirection="column"
        alignItems="center"
    >
      <Navbar />
      <Box width="70%" maxW="1200px">
        <Tile>{children}</Tile>
        <Footer />
      </Box>
    </Box>
);

export default HomePage;