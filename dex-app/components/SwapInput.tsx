import { Box, Button, HStack, Image, Input, Text, VStack } from "@chakra-ui/react";
import React from "react";

type Props = {
  type: "native" | "token";
  tokenImage?: string;
  current: string;
  setValue: (value: string) => void;
  max?: string;
  value: string;
};

export default function SwapInput({
  type,
  tokenImage,
  setValue,
  value,
  current,
  max,
}: Props) {
  const isActive = current === type;
  
  return (
    <Box
      w="full"
      bg="rgba(15, 20, 40, 0.6)"
      backdropFilter="blur(10px)"
      rounded="2xl"
      p="5"
      borderWidth="2px"
      borderColor={isActive ? "rgba(100, 149, 237, 0.5)" : "rgba(100, 149, 237, 0.1)"}
      boxShadow={isActive ? "0 0 20px rgba(100, 149, 237, 0.2)" : "none"}
      transition="all 0.3s ease"
      position="relative"
      overflow="hidden"
      _before={{
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: "2xl",
        padding: "2px",
        background: isActive 
          ? "linear-gradient(135deg, #6495ED, #88b8ff)" 
          : "transparent",
        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        opacity: isActive ? 1 : 0,
        transition: "opacity 0.3s ease",
      }}
    >
      <VStack align="stretch" spacing="3">
        <HStack justify="space-between">
          <HStack spacing="3">
            <Box
              position="relative"
              w="10"
              h="10"
              borderRadius="full"
              overflow="hidden"
              boxShadow="0 0 15px rgba(100, 149, 237, 0.3)"
              transition="all 0.3s ease"
              _hover={{
                transform: "scale(1.1)",
                boxShadow: "0 0 20px rgba(100, 149, 237, 0.5)",
              }}
            >
              <Image 
                src={tokenImage || "/token.png"} 
                w="full" 
                h="full" 
                objectFit="cover"
                alt="Token"
              />
            </Box>
            <Text 
              fontSize="lg" 
              fontWeight="600"
              color="gray.300"
            >
              {type === "native" ? "Native" : "Token"}
            </Text>
          </HStack>
          
          {isActive && max && (
            <Button
              size="sm"
              onClick={() => setValue(max || "0")}
              bg="rgba(100, 149, 237, 0.2)"
              color="#6495ED"
              borderWidth="1px"
              borderColor="rgba(100, 149, 237, 0.3)"
              _hover={{
                bg: "rgba(100, 149, 237, 0.3)",
                borderColor: "#6495ED",
                transform: "translateY(-1px)",
              }}
              transition="all 0.2s ease"
              fontSize="xs"
              fontWeight="600"
            >
              MAX
            </Button>
          )}
        </HStack>
        
        <Input
          type="number"
          placeholder="0.0"
          fontSize="4xl"
          fontWeight="700"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          py="2"
          isDisabled={!isActive}
          border="none"
          fontFamily="'Inter', monospace"
          color={isActive ? "white" : "gray.600"}
          bg="transparent"
          _placeholder={{ 
            color: isActive ? "gray.600" : "gray.700" 
          }}
          _focus={{ 
            boxShadow: "none",
            outline: "none"
          }}
          _disabled={{
            opacity: 0.5,
            cursor: "not-allowed"
          }}
        />
        
        {max && (
          <Text 
            fontSize="sm" 
            color="gray.500"
            fontWeight="500"
          >
            Balance: {parseFloat(max).toFixed(4)}
          </Text>
        )}
      </VStack>
    </Box>
  );
}
