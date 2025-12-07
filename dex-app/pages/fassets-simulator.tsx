import Head from "next/head";
import { useState } from "react";
import { ethers } from "ethers";
import { useToast, Box, VStack, Text, Grid, HStack, Button, Spinner, Flex } from "@chakra-ui/react";
import Navbar from "@/components/Navbar";

interface SwapResult {
  amountIn: string;
  amountOut: string;
  priceImpact: string;
  slippage: string;
  gasUsed: string;
  gasPrice: string;
  totalFee: string;
  txHash: string;
}

export default function FAssetsSimulatorPage() {
  const toast = useToast();

  // Mock pool state
  const [poolState, setPoolState] = useState({
    fethReserve: ethers.utils.parseEther("100"),
    wflrReserve: ethers.utils.parseEther("1000"),
  });

  // User state
  const [userFETH, setUserFETH] = useState(ethers.utils.parseEther("10"));
  const [userWFLR, setUserWFLR] = useState(ethers.utils.parseEther("100"));
  const [userLiquidity, setUserLiquidity] = useState(ethers.utils.parseEther("31.62")); // sqrt(100 * 1000)

  const [logs, setLogs] = useState<string[]>([]);
  const [swapResult, setSwapResult] = useState<SwapResult | null>(null);
  const [totalFeesAccumulated, setTotalFeesAccumulated] = useState(ethers.utils.parseEther("0"));
  const [txCount, setTxCount] = useState(0);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const clearLogs = () => setLogs([]);

  // Generate realistic gas fees (Flare Coston2 testnet)
  const generateGasFees = () => {
    const gasPrice = ethers.BigNumber.from("25000000000"); // 25 Gwei
    const gasUsed = ethers.BigNumber.from(
      250000 + Math.floor(Math.random() * 100000) // 250k-350k
    );
    const totalFeeWei = gasPrice.mul(gasUsed);

    return {
      gasPrice,
      gasUsed,
      totalFeeWei,
      gasPriceGwei: ethers.utils.formatUnits(gasPrice, "gwei"),
      totalFeeFlr: ethers.utils.formatEther(totalFeeWei),
    };
  };

  // Generate realistic transaction hash
  const generateTxHash = () => {
    return "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  };

  // AMM formula: x * y = k (constant product formula)
  const calculateSwapAmount = (
    amountIn: ethers.BigNumber,
    reserveIn: ethers.BigNumber,
    reserveOut: ethers.BigNumber
  ): ethers.BigNumber => {
    const numerator = amountIn.mul(reserveOut);
    const denominator = reserveIn.add(amountIn);
    return numerator.div(denominator);
  };

  const simulateSwapFETHForFLR = async () => {
    try {
      const amount = prompt("Enter amount of fETH to swap (e.g., 1):");
      if (!amount) return;

      clearLogs();
      addLog("🚀 Starting fETH → WFLR Swap Simulation\n");

      const amountWei = ethers.utils.parseEther(amount);

      // Check balance
      addLog(`📊 Checking balance: ${amount} fETH`);
      if (userFETH.lt(amountWei)) {
        addLog("❌ Insufficient fETH balance!");
        toast({
          title: "Error",
          description: "Insufficient fETH balance",
          status: "error",
          duration: 5,
          isClosable: true,
        });
        return;
      }
      addLog(`✓ Balance check passed`);

      // Approve step
      addLog("\n1️⃣ Approval Step");
      addLog(`Approving ${amount} fETH for pool...`);
      await new Promise((resolve) => setTimeout(resolve, 500));
      addLog(`✓ Approval confirmed`);

      // Calculate output
      addLog("\n2️⃣ Calculating Swap Output");
      const amountOut = calculateSwapAmount(
        amountWei,
        poolState.fethReserve,
        poolState.wflrReserve
      );
      const amountOutFormatted = ethers.utils.formatEther(amountOut);

      addLog(`Input: ${amount} fETH`);
      addLog(`Output: ${amountOutFormatted} WFLR`);

      // Calculate metrics
      const pricePerFETH = amountOut.mul(ethers.BigNumber.from(10).pow(18)).div(amountWei);
      const pricePerFETHFormatted = ethers.utils.formatEther(pricePerFETH);

      const spotPrice = poolState.wflrReserve.mul(ethers.BigNumber.from(10).pow(18)).div(poolState.fethReserve);
      const spotPriceFormatted = ethers.utils.formatEther(spotPrice);

      const priceImpact = spotPrice.sub(pricePerFETH).mul(10000).div(spotPrice);
      const priceImpactFormatted = priceImpact.toNumber() / 100;

      addLog(`\nExecution Price: ${pricePerFETHFormatted} WFLR per fETH`);
      addLog(`Spot Price: ${spotPriceFormatted} WFLR per fETH`);
      addLog(`Price Impact: ${priceImpactFormatted.toFixed(2)}%`);

      // Execute swap
      addLog("\n3️⃣ Executing Swap");
      addLog("Broadcasting transaction...");
      
      // Generate gas fees
      const { gasPrice, gasUsed, totalFeeWei, gasPriceGwei, totalFeeFlr } = generateGasFees();
      const txHash = generateTxHash();
      
      addLog(`\n⛽ Gas Estimation:`);
      addLog(`Gas Price: ${gasPriceGwei} Gwei`);
      addLog(`Gas Used: ${gasUsed.toString()}`);
      addLog(`Total Fee: ${totalFeeFlr} FLR`);
      
      await new Promise((resolve) => setTimeout(resolve, 800));
      addLog(`✓ Transaction confirmed`);
      addLog(`📍 Tx Hash: ${txHash}`);

      // Update state
      const newPoolFETH = poolState.fethReserve.add(amountWei);
      const newPoolWFLR = poolState.wflrReserve.sub(amountOut);
      const newUserFETH = userFETH.sub(amountWei);
      const newUserWFLR = userWFLR.add(amountOut);

      setPoolState({
        fethReserve: newPoolFETH,
        wflrReserve: newPoolWFLR,
      });

      setUserFETH(newUserFETH);
      setUserWFLR(newUserWFLR);
      setTotalFeesAccumulated(totalFeesAccumulated.add(totalFeeWei));
      setTxCount(txCount + 1);

      addLog("\n✅ Swap Completed Successfully!");
      addLog(`\n📈 Updated Pool State:`);
      addLog(`fETH Reserve: ${ethers.utils.formatEther(newPoolFETH)}`);
      addLog(`WFLR Reserve: ${ethers.utils.formatEther(newPoolWFLR)}`);
      addLog(`\n👤 Your New Balance:`);
      addLog(`fETH: ${ethers.utils.formatEther(newUserFETH)}`);
      addLog(`WFLR: ${ethers.utils.formatEther(newUserWFLR)}`);

      setSwapResult({
        amountIn: amount,
        amountOut: amountOutFormatted,
        priceImpact: `${priceImpactFormatted.toFixed(2)}%`,
        slippage: "0.3%",
        gasUsed: gasUsed.toString(),
        gasPrice: gasPriceGwei,
        totalFee: totalFeeFlr,
        txHash: txHash,
      });

      toast({
        title: "Swap Successful",
        description: `Swapped ${amount} fETH for ${amountOutFormatted} WFLR`,
        status: "success",
        duration: 5,
        isClosable: true,
      });
    } catch (err) {
      addLog(`❌ Error: ${err instanceof Error ? err.message : "Unknown error"}`);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Unknown error",
        status: "error",
        duration: 5,
        isClosable: true,
      });
    }
  };

  const simulateSwapFLRForFETH = async () => {
    try {
      const amount = prompt("Enter amount of WFLR to swap (e.g., 10):");
      if (!amount) return;

      clearLogs();
      addLog("🚀 Starting WFLR → fETH Swap Simulation\n");

      const amountWei = ethers.utils.parseEther(amount);

      if (userWFLR.lt(amountWei)) {
        addLog("❌ Insufficient WFLR balance!");
        toast({
          title: "Error",
          description: "Insufficient WFLR balance",
          status: "error",
          duration: 5,
          isClosable: true,
        });
        return;
      }

      addLog(`✓ Balance check passed`);
      addLog("\n1️⃣ Approval Step");
      await new Promise((resolve) => setTimeout(resolve, 500));
      addLog(`✓ Approval confirmed`);

      const amountOut = calculateSwapAmount(
        amountWei,
        poolState.wflrReserve,
        poolState.fethReserve
      );
      const amountOutFormatted = ethers.utils.formatEther(amountOut);

      const { gasPrice, gasUsed, totalFeeWei, gasPriceGwei, totalFeeFlr } = generateGasFees();
      const txHash = generateTxHash();

      await new Promise((resolve) => setTimeout(resolve, 800));
      addLog(`✓ Transaction confirmed`);

      const newPoolWFLR = poolState.wflrReserve.add(amountWei);
      const newPoolFETH = poolState.fethReserve.sub(amountOut);
      const newUserWFLR = userWFLR.sub(amountWei);
      const newUserFETH = userFETH.add(amountOut);

      setPoolState({
        fethReserve: newPoolFETH,
        wflrReserve: newPoolWFLR,
      });

      setUserFETH(newUserFETH);
      setUserWFLR(newUserWFLR);
      setTotalFeesAccumulated(totalFeesAccumulated.add(totalFeeWei));
      setTxCount(txCount + 1);

      const pricePerWFLR = amountOut.mul(ethers.BigNumber.from(10).pow(18)).div(amountWei);
      const spotPrice = poolState.fethReserve.mul(ethers.BigNumber.from(10).pow(18)).div(poolState.wflrReserve);
      const priceImpact = spotPrice.sub(pricePerWFLR).mul(10000).div(spotPrice);
      const priceImpactFormatted = priceImpact.toNumber() / 100;

      setSwapResult({
        amountIn: amount,
        amountOut: amountOutFormatted,
        priceImpact: `${priceImpactFormatted.toFixed(2)}%`,
        slippage: "0.3%",
        gasUsed: gasUsed.toString(),
        gasPrice: gasPriceGwei,
        totalFee: totalFeeFlr,
        txHash: txHash,
      });

      toast({
        title: "Swap Successful",
        description: `Swapped ${amount} WFLR for ${amountOutFormatted} fETH`,
        status: "success",
        duration: 5,
        isClosable: true,
      });
    } catch (err) {
      addLog(`❌ Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  return (
    <>
      <Head>
        <title>fAssets Simulator - DOMEX</title>
        <meta name="description" content="fAssets Pool Simulator" />
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
                fAssets Simulator
              </Text>
              <Text fontSize="md" color="gray.400" fontWeight="500">
                Test swaps in a simulated environment
              </Text>
            </VStack>

            {/* Pool Status Card */}
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
                  📊 Pool Status
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
                      {ethers.utils.formatEther(poolState.fethReserve)}
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
                      {ethers.utils.formatEther(poolState.wflrReserve)}
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
                  <Text fontSize="sm" color="gray.400" fontWeight="600">
                    Current Price: <Text as="span" color="#6495ED" fontWeight="700">
                      1 fETH = {(
                        Number(ethers.utils.formatEther(poolState.wflrReserve)) /
                        Number(ethers.utils.formatEther(poolState.fethReserve))
                      ).toFixed(2)} WFLR
                    </Text>
                  </Text>
                </Box>
              </VStack>
            </Box>

            {/* User Balances Card */}
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
                  👤 Your Balances
                </Text>

                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap="4">
                  <Box
                    p="6"
                    bg="rgba(74, 222, 128, 0.1)"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor="rgba(74, 222, 128, 0.2)"
                    textAlign="center"
                  >
                    <Text fontSize="sm" color="gray.400" fontWeight="600" mb="3">
                      fETH
                    </Text>
                    <Text fontSize="3xl" fontWeight="700" color="#4ade80">
                      {ethers.utils.formatEther(userFETH)}
                    </Text>
                  </Box>

                  <Box
                    p="6"
                    bg="rgba(251, 146, 60, 0.1)"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor="rgba(251, 146, 60, 0.2)"
                    textAlign="center"
                  >
                    <Text fontSize="sm" color="gray.400" fontWeight="600" mb="3">
                      WFLR
                    </Text>
                    <Text fontSize="3xl" fontWeight="700" color="#fb923c">
                      {ethers.utils.formatEther(userWFLR)}
                    </Text>
                  </Box>
                </Grid>

                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap="3">
                  <Button
                    onClick={simulateSwapFETHForFLR}
                    h="12"
                    bgGradient="linear(135deg, #6495ED 0%, #4a7dd9 100%)"
                    color="white"
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "0 0 20px rgba(100, 149, 237, 0.5)",
                    }}
                  >
                    Swap fETH → WFLR
                  </Button>

                  <Button
                    onClick={simulateSwapFLRForFETH}
                    h="12"
                    bgGradient="linear(135deg, #fb923c 0%, #f97316 100%)"
                    color="white"
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "0 0 20px rgba(251, 146, 60, 0.5)",
                    }}
                  >
                    Swap WFLR → fETH
                  </Button>
                </Grid>
              </VStack>
            </Box>

            {/* Swap Result Card */}
            {swapResult && (
              <Box
                w="full"
                bg="rgba(74, 222, 128, 0.1)"
                backdropFilter="blur(20px)"
                borderRadius="3xl"
                borderWidth="2px"
                borderColor="rgba(74, 222, 128, 0.3)"
                boxShadow="0 0 30px rgba(74, 222, 128, 0.2)"
                p={{ base: "6", md: "8" }}
              >
                <VStack spacing="5" align="stretch">
                  <Text fontSize="2xl" fontWeight="700" color="#4ade80">
                    ✅ Last Swap Result
                  </Text>

                  <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap="4">
                    <Box>
                      <Text fontSize="sm" color="gray.400" fontWeight="600" mb="1">
                        Amount In
                      </Text>
                      <Text fontSize="xl" fontWeight="700" color="white">
                        {swapResult.amountIn}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.400" fontWeight="600" mb="1">
                        Amount Out
                      </Text>
                      <Text fontSize="xl" fontWeight="700" color="white">
                        {swapResult.amountOut}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.400" fontWeight="600" mb="1">
                        Price Impact
                      </Text>
                      <Text fontSize="xl" fontWeight="700" color="white">
                        {swapResult.priceImpact}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.400" fontWeight="600" mb="1">
                        Gas Fee
                      </Text>
                      <Text fontSize="xl" fontWeight="700" color="#fb923c">
                        ⛽ {swapResult.totalFee} FLR
                      </Text>
                    </Box>
                  </Grid>

                  <Box
                    p="4"
                    bg="rgba(100, 149, 237, 0.1)"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor="rgba(100, 149, 237, 0.2)"
                  >
                    <Text fontSize="sm" color="gray.400" fontWeight="600" mb="2">
                      Transaction Hash
                    </Text>
                    <Text
                      fontSize="xs"
                      fontFamily="monospace"
                      color="#6495ED"
                      wordBreak="break-all"
                    >
                      {swapResult.txHash}
                    </Text>
                  </Box>
                </VStack>
              </Box>
            )}

            {/* Fee Summary */}
            {txCount > 0 && (
              <Box
                w="full"
                bg="rgba(168, 85, 247, 0.1)"
                backdropFilter="blur(20px)"
                borderRadius="3xl"
                borderWidth="2px"
                borderColor="rgba(168, 85, 247, 0.3)"
                boxShadow="0 0 30px rgba(168, 85, 247, 0.2)"
                p={{ base: "6", md: "8" }}
              >
                <Text fontSize="2xl" fontWeight="700" color="#a855f7" mb="5">
                  💰 Transaction Summary
                </Text>

                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap="4">
                  <Box
                    p="6"
                    bg="rgba(168, 85, 247, 0.1)"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor="rgba(168, 85, 247, 0.2)"
                    textAlign="center"
                  >
                    <Text fontSize="sm" color="gray.400" fontWeight="600" mb="3">
                      Total Transactions
                    </Text>
                    <Text fontSize="4xl" fontWeight="700" color="#a855f7">
                      {txCount}
                    </Text>
                  </Box>

                  <Box
                    p="6"
                    bg="rgba(239, 68, 68, 0.1)"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor="rgba(239, 68, 68, 0.2)"
                    textAlign="center"
                  >
                    <Text fontSize="sm" color="gray.400" fontWeight="600" mb="3">
                      Total Fees Paid
                    </Text>
                    <Text fontSize="3xl" fontWeight="700" color="#ef4444">
                      {ethers.utils.formatEther(totalFeesAccumulated)} FLR
                    </Text>
                  </Box>
                </Grid>
              </Box>
            )}

            {/* Transaction Logs */}
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
              <Flex justify="space-between" align="center" mb="5">
                <Text fontSize="2xl" fontWeight="700" color="white">
                  📋 Transaction Log
                </Text>
                <Button
                  onClick={clearLogs}
                  isDisabled={logs.length === 0}
                  size="sm"
                  bgGradient="linear(135deg, #ef4444 0%, #dc2626 100%)"
                  color="white"
                  _hover={{
                    transform: "translateY(-1px)",
                    boxShadow: "0 0 15px rgba(239, 68, 68, 0.5)",
                  }}
                >
                  Clear
                </Button>
              </Flex>

              <Box
                bg="#0f1419"
                borderRadius="xl"
                p="4"
                fontFamily="monospace"
                fontSize="sm"
                color="#4db8ff"
                maxH="400px"
                overflowY="auto"
                borderWidth="1px"
                borderColor="rgba(100, 149, 237, 0.2)"
                css={{
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'rgba(15, 20, 40, 0.5)',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: 'linear-gradient(180deg, #6495ED 0%, #4a7dd9 100%)',
                    borderRadius: '10px',
                  },
                }}
              >
                {logs.length === 0 ? (
                  <Text color="gray.600">Logs will appear here...</Text>
                ) : (
                  logs.map((log, idx) => (
                    <Box key={idx} mb="1" whiteSpace="pre-wrap">
                      {log}
                    </Box>
                  ))
                )}
              </Box>
            </Box>
          </VStack>
        </Box>
      </Box>
    </>
  );
}
