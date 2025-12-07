import Head from "next/head";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useAddress } from "@thirdweb-dev/react";
import { useFAsset } from "@/hooks/useFAsset";
import Navbar from "@/components/Navbar";
import { Box, useToast, Text, VStack, HStack, Grid, Button, Spinner } from "@chakra-ui/react";

export default function FAssetsPage() {
  const address = useAddress();
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [reserveFETH, setReserveFETH] = useState("0");
  const [reserveWFLR, setReserveWFLR] = useState("0");
  const [fethBalance, setFethBalance] = useState("0");
  const [wflrBalance, setWflrBalance] = useState("0");
  const [fethAddress, setFethAddress] = useState<string | null>(null);
  const [wflrAddress, setWflrAddress] = useState<string | null>(null);

  const {
    swapFETHForFLR,
    swapFLRForFETH,
    addLiquidity,
    removeLiquidity,
    getReserveFETH,
    getReserveWFLR,
    getFETHAddress,
    getWFLRAddress,
    approveFETH,
    approveWFLR,
    getFETHBalance,
    getWFLRBalance,
    loading,
    error,
    isReady,
  } = useFAsset(provider);

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
    const loadReserves = async () => {
      if (isReady) {
        try {
          const feth = await getReserveFETH();
          const wflr = await getReserveWFLR();
          const fethAddr = await getFETHAddress();
          const wflrAddr = await getWFLRAddress();
          
          setReserveFETH(feth);
          setReserveWFLR(wflr);
          setFethAddress(fethAddr);
          setWflrAddress(wflrAddr);

          if (address && fethAddr && wflrAddr) {
            const fethBal = await getFETHBalance(fethAddr, address);
            const wflrBal = await getWFLRBalance(wflrAddr, address);
            setFethBalance(fethBal);
            setWflrBalance(wflrBal);
          }
        } catch (err) {
          console.error("Failed to load reserves:", err);
        }
      }
    };

    loadReserves();
  }, [isReady, getReserveFETH, getReserveWFLR, getFETHAddress, getWFLRAddress, getFETHBalance, getWFLRBalance, address]);

  const handleSwapFETHForFLR = async () => {
    try {
      const amount = prompt("Enter amount of fETH to swap:");
      if (!amount) return;

      if (!fethAddress) {
        toast({
          title: "Error",
          description: "fETH address not loaded",
          status: "error",
          duration: 5,
          isClosable: true,
        });
        return;
      }

      // First approve the token
      toast({
        title: "Approving",
        description: "Please approve fETH spending...",
        status: "info",
        duration: 10,
        isClosable: true,
      });

      await approveFETH(fethAddress, amount);

      // Then swap
      await swapFETHForFLR(amount);
      toast({
        title: "Success",
        description: `Swapped ${amount} fETH for FLR`,
        status: "success",
        duration: 5,
        isClosable: true,
      });

      const newReserves = await Promise.all([getReserveFETH(), getReserveWFLR()]);
      setReserveFETH(newReserves[0]);
      setReserveWFLR(newReserves[1]);
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

  const handleSwapFLRForFETH = async () => {
    try {
      const amount = prompt("Enter amount of WFLR to swap:");
      if (!amount) return;

      if (!wflrAddress) {
        toast({
          title: "Error",
          description: "WFLR address not loaded",
          status: "error",
          duration: 5,
          isClosable: true,
        });
        return;
      }

      // First approve the token
      toast({
        title: "Approving",
        description: "Please approve WFLR spending...",
        status: "info",
        duration: 10,
        isClosable: true,
      });

      await approveWFLR(wflrAddress, amount);

      // Then swap
      await swapFLRForFETH(amount);
      toast({
        title: "Success",
        description: `Swapped ${amount} WFLR for fETH`,
        status: "success",
        duration: 5,
        isClosable: true,
      });

      const newReserves = await Promise.all([getReserveFETH(), getReserveWFLR()]);
      setReserveFETH(newReserves[0]);
      setReserveWFLR(newReserves[1]);
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

  const handleAddLiquidity = async () => {
    try {
      const feth = prompt("Enter amount of fETH:");
      if (!feth) return;
      const wflr = prompt("Enter amount of WFLR:");
      if (!wflr) return;

      await addLiquidity(feth, wflr);
      toast({
        title: "Success",
        description: `Added ${feth} fETH and ${wflr} WFLR as liquidity`,
        status: "success",
        duration: 5,
        isClosable: true,
      });

      const newReserves = await Promise.all([getReserveFETH(), getReserveWFLR()]);
      setReserveFETH(newReserves[0]);
      setReserveWFLR(newReserves[1]);
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

  const handleRemoveLiquidity = async () => {
    try {
      const liquidity = prompt("Enter amount of liquidity tokens to burn:");
      if (!liquidity) return;

      await removeLiquidity(liquidity);
      toast({
        title: "Success",
        description: `Removed ${liquidity} liquidity`,
        status: "success",
        duration: 5,
        isClosable: true,
      });

      const newReserves = await Promise.all([getReserveFETH(), getReserveWFLR()]);
      setReserveFETH(newReserves[0]);
      setReserveWFLR(newReserves[1]);
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

  return (
    <>
      <Head>
        <title>fAssets Exchange - DOMEX</title>
        <meta name="description" content="fAssets Exchange" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Box minH="100vh">
        <Navbar />

        <Box minH="calc(100vh - 80px)" py="10" px="5">
          <VStack spacing="6" maxW="800px" mx="auto">
            {/* Header */}
            <VStack spacing="2" textAlign="center">
              <Text
                fontSize={{ base: "3xl", md: "4xl" }}
                fontWeight="800"
                bgGradient="linear(to-r, #6495ED, #88b8ff)"
                bgClip="text"
                letterSpacing="tight"
              >
                fAsset Pool
              </Text>
              <Text fontSize="md" color="gray.400" fontWeight="500">
                Manage liquidity and swap fAssets
              </Text>
            </VStack>

            {/* Pool Info Card */}
            <Box
              w="full"
              bg="rgba(15, 20, 40, 0.7)"
              backdropFilter="blur(20px)"
              borderRadius="3xl"
              borderWidth="1px"
              borderColor="rgba(100, 149, 237, 0.2)"
              boxShadow="0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 0 20px rgba(100, 149, 237, 0.05)"
              p={{ base: "6", md: "8" }}
            >
              <VStack spacing="5" align="stretch">
                <Text fontSize="2xl" fontWeight="700" color="white">
                  Pool Reserves
                </Text>

                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap="4">
                  <Box
                    p="6"
                    bg="rgba(100, 149, 237, 0.1)"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor="rgba(100, 149, 237, 0.2)"
                    textAlign="center"
                  >
                    <Text fontSize="sm" color="gray.400" fontWeight="600" mb="3">
                      fETH Reserve
                    </Text>
                    <Text fontSize="3xl" fontWeight="700" color="#6495ED">
                      {parseFloat(reserveFETH).toFixed(4)}
                    </Text>
                    <Text fontSize="xs" color="gray.500" mt="2">
                      Flare Ethereum
                    </Text>
                  </Box>

                  <Box
                    p="6"
                    bg="rgba(100, 149, 237, 0.1)"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor="rgba(100, 149, 237, 0.2)"
                    textAlign="center"
                  >
                    <Text fontSize="sm" color="gray.400" fontWeight="600" mb="3">
                      WFLR Reserve
                    </Text>
                    <Text fontSize="3xl" fontWeight="700" color="#6495ED">
                      {parseFloat(reserveWFLR).toFixed(4)}
                    </Text>
                    <Text fontSize="xs" color="gray.500" mt="2">
                      Wrapped Flare
                    </Text>
                  </Box>
                </Grid>

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

                <VStack spacing="3">
                  <Text fontSize="lg" fontWeight="700" color="white" alignSelf="flex-start">
                    Swap Operations
                  </Text>
                  <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap="3" w="full">
                    <Button
                      onClick={handleSwapFETHForFLR}
                      isDisabled={loading}
                      h="12"
                      bgGradient="linear(135deg, #6495ED 0%, #4a7dd9 100%)"
                      color="white"
                      _hover={{
                        transform: "translateY(-2px)",
                        boxShadow: "0 0 20px rgba(100, 149, 237, 0.5)",
                      }}
                    >
                      {loading ? <Spinner size="sm" /> : "Swap fETH → FLR"}
                    </Button>

                    <Button
                      onClick={handleSwapFLRForFETH}
                      isDisabled={loading}
                      h="12"
                      bgGradient="linear(135deg, #6495ED 0%, #4a7dd9 100%)"
                      color="white"
                      _hover={{
                        transform: "translateY(-2px)",
                        boxShadow: "0 0 20px rgba(100, 149, 237, 0.5)",
                      }}
                    >
                      {loading ? <Spinner size="sm" /> : "Swap FLR → fETH"}
                    </Button>
                  </Grid>
                </VStack>

                <VStack spacing="3">
                  <Text fontSize="lg" fontWeight="700" color="white" alignSelf="flex-start">
                    Liquidity Operations
                  </Text>
                  <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap="3" w="full">
                    <Button
                      onClick={handleAddLiquidity}
                      isDisabled={loading}
                      h="12"
                      bgGradient="linear(135deg, #4ade80 0%, #22c55e 100%)"
                      color="white"
                      _hover={{
                        transform: "translateY(-2px)",
                        boxShadow: "0 0 20px rgba(74, 222, 128, 0.5)",
                      }}
                    >
                      {loading ? <Spinner size="sm" /> : "Add Liquidity"}
                    </Button>

                    <Button
                      onClick={handleRemoveLiquidity}
                      isDisabled={loading}
                      h="12"
                      bgGradient="linear(135deg, #ef4444 0%, #dc2626 100%)"
                      color="white"
                      _hover={{
                        transform: "translateY(-2px)",
                        boxShadow: "0 0 20px rgba(239, 68, 68, 0.5)",
                      }}
                    >
                      {loading ? <Spinner size="sm" /> : "Remove Liquidity"}
                    </Button>
                  </Grid>
                </VStack>
              </VStack>
            </Box>
          </VStack>
        </Box>
      </Box>
    </>
  );
}
