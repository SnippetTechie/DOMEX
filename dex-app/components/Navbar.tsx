import { Box, Flex, Text, Button, HStack } from "@chakra-ui/react";
import { ConnectWallet } from "@thirdweb-dev/react";
import React from "react";
import Link from "next/link";

export default function Navbar() {
  return (
    <Box 
      w="full" 
      position="sticky"
      top="0"
      zIndex="1000"
      bg="rgba(10, 14, 39, 0.8)"
      backdropFilter="blur(20px)"
      borderBottom="1px solid"
      borderColor="rgba(100, 149, 237, 0.2)"
      boxShadow="0 4px 30px rgba(0, 0, 0, 0.1)"
    >
      <Flex
        maxW="7xl"
        w="full"
        mx="auto"
        justifyContent="space-between"
        alignItems="center"
        py="4"
        px={{ base: "5", xl: "8" }}
      >
        <HStack spacing="3">
          <Box
            w="10"
            h="10"
            borderRadius="xl"
            bgGradient="linear(135deg, #6495ED 0%, #4a7dd9 100%)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            boxShadow="0 0 20px rgba(100, 149, 237, 0.4)"
            fontWeight="bold"
            fontSize="xl"
            color="white"
            transition="all 0.3s ease"
            _hover={{
              transform: "rotate(180deg)",
              boxShadow: "0 0 30px rgba(100, 149, 237, 0.6)",
            }}
          >
            D
          </Box>
          <Text 
            fontWeight="800" 
            fontSize="2xl"
            bgGradient="linear(to-r, #6495ED, #88b8ff)"
            bgClip="text"
            letterSpacing="tight"
          >
            DOMEX
          </Text>
        </HStack>
        
        <Flex gap="3" alignItems="center">
          <Link href="/account">
            <Button 
              variant="ghost"
              color="#6495ED"
              borderWidth="1px"
              borderColor="rgba(100, 149, 237, 0.3)"
              _hover={{
                bg: "rgba(100, 149, 237, 0.1)",
                borderColor: "#6495ED",
                transform: "translateY(-2px)",
                boxShadow: "0 0 15px rgba(100, 149, 237, 0.3)",
              }}
              transition="all 0.3s ease"
            >
              Account
            </Button>
          </Link>
          <Link href="/fassets">
            <Button 
              variant="ghost"
              color="#6495ED"
              borderWidth="1px"
              borderColor="rgba(100, 149, 237, 0.3)"
              _hover={{
                bg: "rgba(100, 149, 237, 0.1)",
                borderColor: "#6495ED",
                transform: "translateY(-2px)",
                boxShadow: "0 0 15px rgba(100, 149, 237, 0.3)",
              }}
              transition="all 0.3s ease"
            >
              fAssets
            </Button>
          </Link>
          <Link href="/fassets-simulator">
            <Button 
              variant="ghost"
              color="#6495ED"
              borderWidth="1px"
              borderColor="rgba(100, 149, 237, 0.3)"
              _hover={{
                bg: "rgba(100, 149, 237, 0.1)",
                borderColor: "#6495ED",
                transform: "translateY(-2px)",
                boxShadow: "0 0 15px rgba(100, 149, 237, 0.3)",
              }}
              transition="all 0.3s ease"
            >
              Simulator
            </Button>
          </Link>
          <Link href="/circuitbreaker">
            <Button 
              variant="ghost"
              color="#6495ED"
              borderWidth="1px"
              borderColor="rgba(100, 149, 237, 0.3)"
              _hover={{
                bg: "rgba(100, 149, 237, 0.1)",
                borderColor: "#6495ED",
                transform: "translateY(-2px)",
                boxShadow: "0 0 15px rgba(100, 149, 237, 0.3)",
              }}
              transition="all 0.3s ease"
            >
              Circuit Breaker
            </Button>
          </Link>
          <Box
            sx={{
              "& button": {
                background: "linear-gradient(135deg, #6495ED 0%, #4a7dd9 100%) !important",
                borderRadius: "xl !important",
                fontWeight: "600 !important",
                transition: "all 0.3s ease !important",
                border: "none !important",
                _hover: {
                  transform: "translateY(-2px) !important",
                  boxShadow: "0 0 20px rgba(100, 149, 237, 0.5) !important",
                }
              }
            }}
          >
            <ConnectWallet theme="dark" />
          </Box>
        </Flex>
      </Flex>
    </Box>
  );
}
