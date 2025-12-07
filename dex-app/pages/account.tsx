import Head from "next/head";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useSDK, useAddress } from "@thirdweb-dev/react";
import { useFlareSmartAccount } from "@/hooks/useFlareSmartAccount";
import Navbar from "@/components/Navbar";
import { Box, Button, Flex, Spinner, useToast, Text, VStack, HStack, Grid } from "@chakra-ui/react";

export default function SmartAccountPage() {
  const address = useAddress();
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [balance, setBalance] = useState("0");
  const [nonce, setNonce] = useState("0");
  const [owner, setOwner] = useState("");

  const {
    execute,
    authorizeSigner,
    revokeSigner,
    isAuthorizedSigner,
    getNonce,
    getBalance,
    getOwner,
    fundAccount,
    loading,
    error,
    smartAccountAddress,
    isReady,
  } = useFlareSmartAccount(provider);

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
    const loadAccountInfo = async () => {
      if (isReady) {
        try {
          console.log("Loading account info...");
          const ownerAddr = await getOwner();
          console.log("Owner:", ownerAddr);
          setOwner(ownerAddr || "");

          const balanceStr = await getBalance();
          console.log("Balance:", balanceStr);
          setBalance(balanceStr);

          const nonceStr = await getNonce();
          console.log("Nonce:", nonceStr);
          setNonce(nonceStr);
        } catch (err) {
          console.error("Failed to load account info:", err);
        }
      }
    };

    loadAccountInfo();
  }, [isReady, getBalance, getNonce, getOwner]);

  const handleExecute = async () => {
    try {
      const targetAddress = prompt("Enter target address:");
      const value = prompt("Enter value (in FLR):", "0");
      const data = prompt("Enter call data (hex):", "0x");

      if (!targetAddress || !value || !data) return;

      await execute({
        to: targetAddress,
        value: ethers.utils.parseEther(value).toString(),
        data,
      });

      toast({
        title: "Success",
        description: "Transaction executed successfully",
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

  const handleAuthorizeSigner = async () => {
    try {
      const signer = prompt("Enter signer address:");
      if (!signer) return;

      await authorizeSigner(signer);
      toast({
        title: "Success",
        description: "Signer authorized successfully",
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

  const handleRevokeSigner = async () => {
    try {
      const signer = prompt("Enter signer address to revoke:");
      if (!signer) return;

      await revokeSigner(signer);
      toast({
        title: "Success",
        description: "Signer revoked successfully",
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

  const handleCheckSigner = async () => {
    try {
      const signer = prompt("Enter signer address to check:");
      if (!signer) return;

      const isAuth = await isAuthorizedSigner(signer);
      toast({
        title: "Result",
        description: `Signer ${signer} is ${isAuth ? "authorized" : "not authorized"}`,
        status: isAuth ? "success" : "info",
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

  const handleFundAccount = async () => {
    try {
      const amount = prompt("Enter amount in FLR to send:");
      if (!amount) return;

      await fundAccount(amount);
      toast({
        title: "Success",
        description: `Sent ${amount} FLR to smart account`,
        status: "success",
        duration: 5,
        isClosable: true,
      });

      // Refresh balance
      setTimeout(async () => {
        const newBalance = await getBalance();
        setBalance(newBalance);
      }, 2000);
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

  const handleRefresh = async () => {
    if (isReady && provider) {
      try {
        const balanceStr = await getBalance();
        setBalance(balanceStr);

        const nonceStr = await getNonce();
        setNonce(nonceStr);

        const ownerAddr = await getOwner();
        setOwner(ownerAddr || "");

        toast({
          title: "Refreshed",
          description: "Account info updated",
          status: "success",
          duration: 3,
          isClosable: true,
        });
      } catch (err) {
        console.error("Failed to refresh:", err);
      }
    }
  };

  return (
    <>
      <Head>
        <title>Smart Account - DOMEX</title>
        <meta name="description" content="Flare Smart Account Management" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Box minH="100vh">
        <Navbar />

        <Flex direction="column" align="center" justify="flex-start" minH="calc(100vh - 80px)" py="10" px="5">
          <VStack spacing="6" w="full" maxW="800px">
            {/* Header */}
            <VStack spacing="2" textAlign="center">
              <Text
                fontSize={{ base: "3xl", md: "4xl" }}
                fontWeight="800"
                bgGradient="linear(to-r, #6495ED, #88b8ff)"
                bgClip="text"
                letterSpacing="tight"
              >
                Flare Smart Account
              </Text>
              <Text fontSize="md" color="gray.400" fontWeight="500">
                Manage your smart contract account
              </Text>
            </VStack>

            {/* Account Info Card */}
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
                  Account Details
                </Text>

                <VStack spacing="4" align="stretch">
                  <Box
                    p="4"
                    bg="rgba(100, 149, 237, 0.1)"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor="rgba(100, 149, 237, 0.2)"
                  >
                    <Text fontSize="sm" color="gray.400" fontWeight="600" mb="2">
                      Smart Account Address
                    </Text>
                    <Text
                      fontSize="sm"
                      fontFamily="monospace"
                      color="#6495ED"
                      wordBreak="break-all"
                      fontWeight="600"
                    >
                      {smartAccountAddress}
                    </Text>
                  </Box>

                  <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap="4">
                    <Box
                      p="4"
                      bg="rgba(100, 149, 237, 0.05)"
                      borderRadius="xl"
                      borderWidth="1px"
                      borderColor="rgba(100, 149, 237, 0.1)"
                    >
                      <Text fontSize="sm" color="gray.400" fontWeight="600" mb="2">
                        Balance
                      </Text>
                      <Text fontSize="2xl" fontWeight="700" color="#6495ED">
                        {balance} FLR
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
                        Nonce
                      </Text>
                      <Text fontSize="2xl" fontWeight="700" color="#6495ED">
                        {nonce}
                      </Text>
                    </Box>
                  </Grid>

                  <Box
                    p="4"
                    bg="rgba(100, 149, 237, 0.05)"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor="rgba(100, 149, 237, 0.1)"
                  >
                    <Text fontSize="sm" color="gray.400" fontWeight="600" mb="2">
                      Owner Address
                    </Text>
                    <Text
                      fontSize="sm"
                      fontFamily="monospace"
                      color="white"
                      wordBreak="break-all"
                    >
                      {owner || "Loading..."}
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

                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap="3">
                  <Button
                    onClick={handleFundAccount}
                    isDisabled={loading}
                    h="12"
                    bgGradient="linear(135deg, #6495ED 0%, #4a7dd9 100%)"
                    color="white"
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "0 0 20px rgba(100, 149, 237, 0.5)",
                    }}
                  >
                    {loading ? <Spinner size="sm" /> : "Fund Account"}
                  </Button>

                  <Button
                    onClick={handleExecute}
                    isDisabled={loading}
                    h="12"
                    bgGradient="linear(135deg, #4ade80 0%, #22c55e 100%)"
                    color="white"
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "0 0 20px rgba(74, 222, 128, 0.5)",
                    }}
                  >
                    {loading ? <Spinner size="sm" /> : "Execute Transaction"}
                  </Button>

                  <Button
                    onClick={handleAuthorizeSigner}
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
                    {loading ? <Spinner size="sm" /> : "Authorize Signer"}
                  </Button>

                  <Button
                    onClick={handleRevokeSigner}
                    isDisabled={loading}
                    h="12"
                    bgGradient="linear(135deg, #ef4444 0%, #dc2626 100%)"
                    color="white"
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "0 0 20px rgba(239, 68, 68, 0.5)",
                    }}
                  >
                    {loading ? <Spinner size="sm" /> : "Revoke Signer"}
                  </Button>

                  <Button
                    onClick={handleCheckSigner}
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
                    {loading ? <Spinner size="sm" /> : "Check Signer"}
                  </Button>

                  <Button
                    onClick={handleRefresh}
                    isDisabled={loading}
                    h="12"
                    bgGradient="linear(135deg, #a855f7 0%, #9333ea 100%)"
                    color="white"
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "0 0 20px rgba(168, 85, 247, 0.5)",
                    }}
                  >
                    {loading ? <Spinner size="sm" /> : "Refresh"}
                  </Button>
                </Grid>
              </VStack>
            </Box>
          </VStack>
        </Flex>
      </Box>
    </>
  );
}
