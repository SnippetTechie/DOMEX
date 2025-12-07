import Head from "next/head";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import {
  Box,
  Button,
  Flex,
  HStack,
  Image,
  Input,
  Spinner,
  useToast,
  Text,
  VStack,
  Icon,
} from "@chakra-ui/react";
import { ACTIVE_CHAIN, DEX_ADDRESS, TOKEN_ADDRESS } from "@/const/details";
import {
  ConnectWallet,
  toEther,
  toWei,
  useAddress,
  useBalance,
  useContract,
  useContractMetadata,
  useContractRead,
  useContractWrite,
  useNetworkMismatch,
  useSDK,
  useSwitchChain,
  useTokenBalance,
} from "@thirdweb-dev/react";
import { useEffect, useState } from "react";
import SwapInput from "@/components/SwapInput";
import { DEX_ABI } from "@/const/details";

const inter = Inter({ subsets: ["latin"] });

export function resolveIpfsUri(
  uri?: string,
  options = { gatewayUrl: "https://ipfs.io/ipfs/" }
) {
  if (!uri) {
    return undefined;
  }
  if (uri.startsWith("ipfs://")) {
    return uri.replace("ipfs://", options.gatewayUrl);
  }
  return uri;
}

export default function Home() {
  const toast = useToast();
  const address = useAddress();
  const { contract: tokenContract } = useContract(TOKEN_ADDRESS, "token");
  const { contract: dexContract } = useContract(DEX_ADDRESS, DEX_ABI);
  const { data: symbol } = useContractRead(tokenContract, "symbol");
  const { data: tokenMetadata } = useContractMetadata(tokenContract);
  const { data: tokenBalance } = useTokenBalance(tokenContract, address);
  const { data: nativeBalance } = useBalance();
  const { data: contractTokenBalance } = useTokenBalance(
    tokenContract,
    DEX_ADDRESS
  );

  const isMismatched = useNetworkMismatch();
  const switchChain = useSwitchChain();

  const sdk = useSDK();
  const [contractBalance, setContractBalance] = useState<string>("0");

  const [nativeValue, setNativeValue] = useState<string>("0");
  const [tokenValue, setTokenValue] = useState<string>("0");
  const [currentFrom, setCurrentFrom] = useState<string>("native");
  const [loading, setLoading] = useState<boolean>(false);

  const { mutateAsync: swapNativeToToken } = useContractWrite(
    dexContract,
    "swapEthTotoken"
  );
  const { mutateAsync: swapTokenToNative } = useContractWrite(
    dexContract,
    "swapTokenToEth"
  );
  const { mutateAsync: approveTokenSpending } = useContractWrite(
    tokenContract,
    "approve"
  );
  
  const { data: amountToGet } = useContractRead(
    dexContract,
    "getAmountOfTokens",
    currentFrom === "native"
      ? [
        toWei(nativeValue || "0"),
        toWei(contractBalance || "0"),
        contractTokenBalance?.value,
      ]
      : [
        toWei(tokenValue || "0"),
        contractTokenBalance?.value,
        toWei(contractBalance || "0"),
      ]
  );

  const fetchContractBalance = async () => {
    try {
      const balance = await sdk?.getBalance(DEX_ADDRESS);
      setContractBalance(balance?.displayValue || "0");
    } catch (err) {
      console.error(err);
    }
  };

  const executeSwap = async () => {
    setLoading(true);
    if (isMismatched) {
      switchChain(ACTIVE_CHAIN.chainId);
      setLoading(false);
      return;
    }
    try {
      if (currentFrom === "native") {
        await swapNativeToToken({ overrides: { value: toWei(nativeValue) } });
        toast({
          status: "success",
          title: "Swap Successful",
          description: `You have successfully swapped your ${ACTIVE_CHAIN.nativeCurrency.symbol
            } to ${symbol || "tokens"}.`,
        });
      } else {
        // Approve token spending
        await approveTokenSpending({ args: [DEX_ADDRESS, toWei(tokenValue)] });
        // Swap!
        await swapTokenToNative({ args: [toWei(tokenValue)] });
        toast({
          status: "success",
          title: "Swap Successful",
          description: `You have successfully swapped your ${symbol || "tokens"
            } to ${ACTIVE_CHAIN.nativeCurrency.symbol}.`,
        });
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast({
        status: "error",
        title: "Swap Failed",
        description:
          "There was an error performing the swap. Please try again.",
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContractBalance();
    setInterval(fetchContractBalance, 10000);
  }, []);

  useEffect(() => {
    if (!amountToGet) return;
    if (currentFrom === "native") {
      setTokenValue(toEther(amountToGet));
    } else {
      setNativeValue(toEther(amountToGet));
    }
  }, [amountToGet]);

  return (
    <>
      <Head>
        <title>DOMEX - Decentralized Exchange</title>
        <meta name="description" content="Trade tokens seamlessly on DOMEX" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Box minH="100vh" position="relative">
        <Navbar />

        <Flex
          direction="column"
          align="center"
          justify="center"
          minH="calc(100vh - 80px)"
          px="5"
          py="10"
        >
          {/* Main Swap Card */}
          <VStack spacing="6" w="full" maxW="600px">
            {/* Header */}
            <VStack spacing="2" textAlign="center">
              <Text
                fontSize={{ base: "3xl", md: "5xl" }}
                fontWeight="800"
                bgGradient="linear(to-r, #6495ED, #88b8ff)"
                bgClip="text"
                letterSpacing="tight"
              >
                Swap Tokens
              </Text>
              <Text fontSize="md" color="gray.400" fontWeight="500">
                Trade tokens instantly with the best rates
              </Text>
            </VStack>

            {/* Swap Container */}
            <Box
              w="full"
              bg="rgba(15, 20, 40, 0.7)"
              backdropFilter="blur(20px)"
              borderRadius="3xl"
              borderWidth="1px"
              borderColor="rgba(100, 149, 237, 0.2)"
              boxShadow="0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 0 20px rgba(100, 149, 237, 0.05)"
              p={{ base: "6", md: "8" }}
              position="relative"
              overflow="hidden"
            >
              {/* Decorative gradient orbs */}
              <Box
                position="absolute"
                top="-50px"
                right="-50px"
                w="150px"
                h="150px"
                borderRadius="full"
                bgGradient="radial(circle, rgba(100, 149, 237, 0.3), transparent)"
                filter="blur(40px)"
                pointerEvents="none"
              />
              <Box
                position="absolute"
                bottom="-50px"
                left="-50px"
                w="150px"
                h="150px"
                borderRadius="full"
                bgGradient="radial(circle, rgba(100, 149, 237, 0.2), transparent)"
                filter="blur(40px)"
                pointerEvents="none"
              />

              <VStack spacing="4" position="relative" zIndex="1">
                <Flex
                  direction={currentFrom === "native" ? "column" : "column-reverse"}
                  gap="3"
                  w="full"
                >
                  <SwapInput
                    current={currentFrom}
                    type="native"
                    max={nativeBalance?.displayValue}
                    value={nativeValue}
                    setValue={setNativeValue}
                    tokenImage={resolveIpfsUri(ACTIVE_CHAIN.icon!.url)}
                  />

                  {/* Swap Direction Button */}
                  <Flex justify="center" my="-2">
                    <Button
                      onClick={() =>
                        currentFrom === "native"
                          ? setCurrentFrom("token")
                          : setCurrentFrom("native")
                      }
                      w="12"
                      h="12"
                      borderRadius="xl"
                      bg="rgba(100, 149, 237, 0.2)"
                      borderWidth="2px"
                      borderColor="rgba(100, 149, 237, 0.3)"
                      color="#6495ED"
                      fontSize="2xl"
                      _hover={{
                        bg: "rgba(100, 149, 237, 0.3)",
                        transform: "rotate(180deg)",
                        borderColor: "#6495ED",
                        boxShadow: "0 0 20px rgba(100, 149, 237, 0.4)",
                      }}
                      transition="all 0.4s ease"
                      zIndex="10"
                    >
                      ↓
                    </Button>
                  </Flex>

                  <SwapInput
                    current={currentFrom}
                    type="token"
                    max={tokenBalance?.displayValue}
                    value={tokenValue}
                    setValue={setTokenValue}
                    tokenImage={tokenMetadata?.image}
                  />
                </Flex>

                {address ? (
                  <Button
                    onClick={executeSwap}
                    w="full"
                    h="16"
                    fontSize="xl"
                    fontWeight="700"
                    bgGradient="linear(135deg, #6495ED 0%, #4a7dd9 100%)"
                    color="white"
                    borderRadius="2xl"
                    isDisabled={loading}
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "0 0 30px rgba(100, 149, 237, 0.6)",
                      _disabled: {
                        transform: "none",
                      },
                    }}
                    _active={{
                      transform: "translateY(0)",
                    }}
                    transition="all 0.3s ease"
                    position="relative"
                    overflow="hidden"
                  >
                    {loading ? <Spinner size="md" /> : "Execute Swap"}
                  </Button>
                ) : (
                  <Box
                    w="full"
                    sx={{
                      "& button": {
                        width: "100% !important",
                        height: "64px !important",
                        background: "linear-gradient(135deg, #6495ED 0%, #4a7dd9 100%) !important",
                        borderRadius: "2xl !important",
                        fontSize: "xl !important",
                        fontWeight: "700 !important",
                        transition: "all 0.3s ease !important",
                        _hover: {
                          transform: "translateY(-2px) !important",
                          boxShadow: "0 0 30px rgba(100, 149, 237, 0.6) !important",
                        }
                      }
                    }}
                  >
                    <ConnectWallet theme="dark" />
                  </Box>
                )}
              </VStack>
            </Box>

            {/* Stats Footer */}
            {address && (
              <HStack
                w="full"
                justify="space-around"
                p="4"
                bg="rgba(15, 20, 40, 0.5)"
                backdropFilter="blur(10px)"
                borderRadius="2xl"
                borderWidth="1px"
                borderColor="rgba(100, 149, 237, 0.1)"
              >
                <VStack spacing="1">
                  <Text fontSize="xs" color="gray.500" fontWeight="600">
                    Your Balance
                  </Text>
                  <Text fontSize="sm" color="#6495ED" fontWeight="700">
                    {parseFloat(nativeBalance?.displayValue || "0").toFixed(4)} {ACTIVE_CHAIN.nativeCurrency.symbol}
                  </Text>
                </VStack>
                <Box h="8" w="1px" bg="rgba(100, 149, 237, 0.2)" />
                <VStack spacing="1">
                  <Text fontSize="xs" color="gray.500" fontWeight="600">
                    Token Balance
                  </Text>
                  <Text fontSize="sm" color="#6495ED" fontWeight="700">
                    {parseFloat(tokenBalance?.displayValue || "0").toFixed(4)} {symbol || "TKN"}
                  </Text>
                </VStack>
              </HStack>
            )}
          </VStack>
        </Flex>
      </Box>
    </>
  );
}
