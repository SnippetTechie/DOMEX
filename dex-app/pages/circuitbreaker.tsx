import Head from "next/head";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useAddress } from "@thirdweb-dev/react";
import { useCircuitBreaker } from "@/hooks/useCircuitBreaker";
import Navbar from "@/components/Navbar";
import CircuitBreakerComponent from "@/components/CircuitBreakerComponent";
import { Box, useToast, Text, VStack, HStack, Grid, Button, Spinner } from "@chakra-ui/react";

export default function CircuitBreakerPage() {
  const address = useAddress();
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);

  const {
    loadStatus,
    checkProtectedContract,
    addProtectedContracts,
    removeProtectedContracts,
    setOperationalStatus,
    startGracePeriod,
    overrideRateLimit,
    loading,
    error,
    contract,
    isReady,
    isOperational,
    isRateLimited,
    rateLimitCooldownPeriod,
    lastRateLimitTimestamp,
    gracePeriodEndTimestamp,
  } = useCircuitBreaker(provider);

  const toast = useToast();

  useEffect(() => {
    const initProvider = async () => {
      if (typeof window !== "undefined" && (window as any).ethereum && address) {
        try {
          const browserProvider = new ethers.providers.Web3Provider((window as any).ethereum);
          setProvider(browserProvider);
        } catch (err) {
          console.error("Failed to init provider:", err);
        }
      }
    };

    initProvider();
  }, [address]);

  useEffect(() => {
    if (isReady) {
      loadStatus();
    }
  }, [isReady, loadStatus]);

  const handleLoadStatus = async () => {
    await loadStatus();
    toast({
      title: "Status Loaded",
      status: "success",
      duration: 3,
      isClosable: true,
    });
  };

  const handleCheckProtected = async () => {
    try {
      const contractAddr = prompt("Enter contract address to check:");
      if (!contractAddr) return;

      const isProtected = await checkProtectedContract(contractAddr);
      toast({
        title: "Contract Status",
        description: isProtected ? "Contract is protected" : "Contract is not protected",
        status: isProtected ? "success" : "info",
        duration: 5,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Unknown error",
        status: "error",
        duration: 5,
        isClosable: true,
      });
    }
  };

  const handleAddProtected = async () => {
    try {
      const input = prompt("Enter contract addresses (comma-separated):");
      if (!input) return;

      const addresses = input.split(",").map((addr) => addr.trim());
      await addProtectedContracts(addresses);
      toast({
        title: "Success",
        description: `Added ${addresses.length} protected contract(s)`,
        status: "success",
        duration: 5,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Unknown error",
        status: "error",
        duration: 5,
        isClosable: true,
      });
    }
  };

  const handleRemoveProtected = async () => {
    try {
      const input = prompt("Enter contract addresses to remove (comma-separated):");
      if (!input) return;

      const addresses = input.split(",").map((addr) => addr.trim());
      await removeProtectedContracts(addresses);
      toast({
        title: "Success",
        description: `Removed ${addresses.length} protected contract(s)`,
        status: "success",
        duration: 5,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Unknown error",
        status: "error",
        duration: 5,
        isClosable: true,
      });
    }
  };

  const handleToggleOperational = async () => {
    try {
      await setOperationalStatus(!isOperational);
      toast({
        title: "Success",
        description: `Circuit breaker is now ${!isOperational ? "operational" : "paused"}`,
        status: "success",
        duration: 5,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Unknown error",
        status: "error",
        duration: 5,
        isClosable: true,
      });
    }
  };

  const handleStartGracePeriod = async () => {
    try {
      const daysStr = prompt("Enter grace period duration in days:");
      if (!daysStr) return;

      const days = parseInt(daysStr);
      const endTimestamp = Math.floor(Date.now() / 1000) + days * 24 * 60 * 60;

      await startGracePeriod(endTimestamp);
      toast({
        title: "Success",
        description: `Grace period started for ${days} day(s)`,
        status: "success",
        duration: 5,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Unknown error",
        status: "error",
        duration: 5,
        isClosable: true,
      });
    }
  };

  const handleOverrideRateLimit = async () => {
    try {
      const identifier = prompt("Enter limiter identifier (hex format):");
      if (!identifier) return;

      await overrideRateLimit(identifier);
      toast({
        title: "Success",
        description: "Rate limit overridden",
        status: "success",
        duration: 5,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Unknown error",
        status: "error",
        duration: 5,
        isClosable: true,
      });
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const ts = parseInt(timestamp);
    if (ts === 0) return "Not set";
    return new Date(ts * 1000).toLocaleString();
  };

  return (
    <>
      <Head>
        <title>Circuit Breaker - DOMEX</title>
        <meta name="description" content="Circuit Breaker Management" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Box minH="100vh">
        <Navbar />

        <Box minH="calc(100vh - 80px)" py="10" px="5">
          <VStack spacing="6" maxW="900px" mx="auto">
            {/* Header */}
            <VStack spacing="2" textAlign="center">
              <Text
                fontSize={{ base: "3xl", md: "4xl" }}
                fontWeight="800"
                bgGradient="linear(to-r, #6495ED, #88b8ff)"
                bgClip="text"
                letterSpacing="tight"
              >
                Circuit Breaker Control
              </Text>
              <Text fontSize="md" color="gray.400" fontWeight="500">
                Manage system protection and rate limiting
              </Text>
            </VStack>

            {/* Status Card */}
            <Box
              w="full"
              bg="rgba(15, 20, 40, 0.7)"
              backdropFilter="blur(20px)"
              borderRadius="3xl"
              borderWidth="1px"
              borderColor="rgba(100, 149, 237, 0.2)"
              boxShadow="0 8px 32px 0 rgba(0, 0, 0, 0.37)"
              p={{ base: "6", md: "8" }}
            >
              <VStack spacing="5" align="stretch">
                <Text fontSize="2xl" fontWeight="700" color="white">
                  System Status
                </Text>

                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap="4">
                  <Box
                    p="6"
                    bg={isOperational ? "rgba(74, 222, 128, 0.1)" : "rgba(239, 68, 68, 0.1)"}
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor={isOperational ? "rgba(74, 222, 128, 0.2)" : "rgba(239, 68, 68, 0.2)"}
                  >
                    <HStack justify="space-between" mb="3">
                      <Text fontSize="sm" color="gray.400" fontWeight="600">
                        Operational Status
                      </Text>
                      <Box
                        w="3"
                        h="3"
                        borderRadius="full"
                        bg={isOperational ? "#4ade80" : "#ef4444"}
                        boxShadow={isOperational ? "0 0 10px #4ade80" : "0 0 10px #ef4444"}
                      />
                    </HStack>
                    <Text fontSize="2xl" fontWeight="700" color={isOperational ? "#4ade80" : "#ef4444"}>
                      {isOperational ? "Active" : "Paused"}
                    </Text>
                  </Box>

                  <Box
                    p="6"
                    bg={isRateLimited ? "rgba(239, 68, 68, 0.1)" : "rgba(74, 222, 128, 0.1)"}
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor={isRateLimited ? "rgba(239, 68, 68, 0.2)" : "rgba(74, 222, 128, 0.2)"}
                  >
                    <HStack justify="space-between" mb="3">
                      <Text fontSize="sm" color="gray.400" fontWeight="600">
                        Rate Limit Status
                      </Text>
                      <Box
                        w="3"
                        h="3"
                        borderRadius="full"
                        bg={isRateLimited ? "#ef4444" : "#4ade80"}
                        boxShadow={isRateLimited ? "0 0 10px #ef4444" : "0 0 10px #4ade80"}
                      />
                    </HStack>
                    <Text fontSize="2xl" fontWeight="700" color={isRateLimited ? "#ef4444" : "#4ade80"}>
                      {isRateLimited ? "Limited" : "Normal"}
                    </Text>
                  </Box>
                </Grid>

                <VStack spacing="3" align="stretch">
                  <Box
                    p="4"
                    bg="rgba(100, 149, 237, 0.05)"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor="rgba(100, 149, 237, 0.1)"
                  >
                    <Text fontSize="sm" color="gray.400" fontWeight="600" mb="2">
                      Rate Limit Cooldown Period
                    </Text>
                    <Text fontSize="lg" fontWeight="700" color="#6495ED">
                      {rateLimitCooldownPeriod} seconds
                    </Text>
                  </Box>

                  <Box
                    p="4"
                    bg="rgba(100, 149, 237, 0.05)"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor="rgba(100, 149, 237, 0.1)"
                  >
                    <Text fontSize="sm" color="gray.400" fontWeight="600" mb="2">
                      Last Rate Limit Triggered
                    </Text>
                    <Text fontSize="sm" fontWeight="600" color="white">
                      {formatTimestamp(lastRateLimitTimestamp)}
                    </Text>
                  </Box>

                  <Box
                    p="4"
                    bg="rgba(100, 149, 237, 0.05)"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor="rgba(100, 149, 237, 0.1)"
                  >
                    <Text fontSize="sm" color="gray.400" fontWeight="600" mb="2">
                      Grace Period Ends
                    </Text>
                    <Text fontSize="sm" fontWeight="600" color="white">
                      {formatTimestamp(gracePeriodEndTimestamp)}
                    </Text>
                  </Box>

                  <HStack justify="space-between" p="4" bg="rgba(100, 149, 237, 0.05)" borderRadius="xl">
                    <Text fontSize="sm" color="gray.400" fontWeight="600">
                      Contract Status
                    </Text>
                    <HStack>
                      <Box
                        w="2"
                        h="2"
                        borderRadius="full"
                        bg={isReady ? "#4ade80" : "#ef4444"}
                        boxShadow={isReady ? "0 0 10px #4ade80" : "0 0 10px #ef4444"}
                      />
                      <Text fontSize="sm" fontWeight="600" color={isReady ? "#4ade80" : "#ef4444"}>
                        {isReady ? "Ready" : "Not Ready"}
                      </Text>
                    </HStack>
                  </HStack>
                </VStack>

                {error && (
                  <Box
                    p="4"
                    bg="rgba(239, 68, 68, 0.1)"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor="rgba(239, 68, 68, 0.3)"
                  >
                    <Text fontSize="sm" color="#ef4444" fontWeight="600">
                      Error: {error}
                    </Text>
                  </Box>
                )}
              </VStack>
            </Box>

            {/* Control Actions Card */}
            <Box
              w="full"
              bg="rgba(15, 20, 40, 0.7)"
              backdropFilter="blur(20px)"
              borderRadius="3xl"
              borderWidth="1px"
              borderColor="rgba(100, 149, 237, 0.2)"
              boxShadow="0 8px 32px 0 rgba(0, 0, 0, 0.37)"
              p={{ base: "6", md: "8" }}
            >
              <VStack spacing="5" align="stretch">
                <Text fontSize="2xl" fontWeight="700" color="white">
                  Control Actions
                </Text>

                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap="3">
                  <Button
                    onClick={handleLoadStatus}
                    isDisabled={loading}
                    h="12"
                    bgGradient="linear(135deg, #a855f7 0%, #9333ea 100%)"
                    color="white"
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "0 0 20px rgba(168, 85, 247, 0.5)",
                    }}
                  >
                    {loading ? <Spinner size="sm" /> : "Load Status"}
                  </Button>

                  <Button
                    onClick={handleToggleOperational}
                    isDisabled={loading}
                    h="12"
                    bgGradient={
                      isOperational
                        ? "linear(135deg, #ef4444 0%, #dc2626 100%)"
                        : "linear(135deg, #4ade80 0%, #22c55e 100%)"
                    }
                    color="white"
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: isOperational
                        ? "0 0 20px rgba(239, 68, 68, 0.5)"
                        : "0 0 20px rgba(74, 222, 128, 0.5)",
                    }}
                  >
                    {loading ? <Spinner size="sm" /> : isOperational ? "Pause Breaker" : "Activate Breaker"}
                  </Button>

                  <Button
                    onClick={handleCheckProtected}
                    isDisabled={loading}
                    h="12"
                    bg="rgba(100, 149, 237, 0.2)"
                    color="#6495ED"
                    borderWidth="1px"
                    borderColor="rgba(100, 149, 237, 0.3)"
                    _hover={{
                      bg: "rgba(100, 149, 237, 0.3)",
                      transform: "translateY(-2px)",
                    }}
                  >
                    {loading ? <Spinner size="sm" /> : "Check Protected"}
                  </Button>

                  <Button
                    onClick={handleAddProtected}
                    isDisabled={loading}
                    h="12"
                    bgGradient="linear(135deg, #4ade80 0%, #22c55e 100%)"
                    color="white"
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "0 0 20px rgba(74, 222, 128, 0.5)",
                    }}
                  >
                    {loading ? <Spinner size="sm" /> : "Add Protected"}
                  </Button>

                  <Button
                    onClick={handleRemoveProtected}
                    isDisabled={loading}
                    h="12"
                    bgGradient="linear(135deg, #ef4444 0%, #dc2626 100%)"
                    color="white"
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "0 0 20px rgba(239, 68, 68, 0.5)",
                    }}
                  >
                    {loading ? <Spinner size="sm" /> : "Remove Protected"}
                  </Button>

                  <Button
                    onClick={handleStartGracePeriod}
                    isDisabled={loading}
                    h="12"
                    bgGradient="linear(135deg, #fb923c 0%, #f97316 100%)"
                    color="white"
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "0 0 20px rgba(251, 146, 60, 0.5)",
                    }}
                  >
                    {loading ? <Spinner size="sm" /> : "Start Grace Period"}
                  </Button>

                  <Button
                    onClick={handleOverrideRateLimit}
                    isDisabled={loading}
                    h="12"
                    gridColumn={{ base: "1", md: "1 / -1" }}
                    bgGradient="linear(135deg, #6495ED 0%, #4a7dd9 100%)"
                    color="white"
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "0 0 20px rgba(100, 149, 237, 0.5)",
                    }}
                  >
                    {loading ? <Spinner size="sm" /> : "Override Rate Limit"}
                  </Button>
                </Grid>
              </VStack>
            </Box>

            {/* Circuit Breaker Component */}
            <Box w="full">
              <CircuitBreakerComponent
                provider={provider}
                circuitBreakerContract={contract}
              />
            </Box>
          </VStack>
        </Box>
      </Box>
    </>
  );
}
