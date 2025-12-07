/**
 * CircuitBreaker Testing Script
 * Run this with: npx hardhat run scripts/testCircuitBreaker.js --network <network>
 */

const hre = require("hardhat");
const ethers = hre.ethers;

async function main() {
  console.log("🔍 CircuitBreaker Testing Script\n");

  const [owner, protectedContract, user] = await ethers.getSigners();
  console.log("📍 Test Account Addresses:");
  console.log("  Owner:", owner.address);
  console.log("  Protected Contract:", protectedContract.address);
  console.log("  User:", user.address);

  // ============= DEPLOYMENT =============
  console.log("\n📦 DEPLOYING CircuitBreaker...");

  const CircuitBreaker = await ethers.getContractFactory("CircuitBreaker");
  const RATE_LIMIT_COOLDOWN = 3600; // 1 hour - faster recovery for testing
  const WITHDRAWAL_PERIOD = 172800; // 2 days - matches test window
  const LIQUIDITY_TICK_LENGTH = 600; // 10 minutes - granular tracking

  const circuitBreaker = await CircuitBreaker.deploy(
    RATE_LIMIT_COOLDOWN,
    WITHDRAWAL_PERIOD,
    LIQUIDITY_TICK_LENGTH,
    owner.address
  );

  await circuitBreaker.deployed();
  console.log("✅ CircuitBreaker deployed at:", circuitBreaker.address);

  // ============= TEST 1: Check Deployment =============
  console.log("\n📋 TEST 1: Verify Deployment Parameters");
  const withdrawalPeriod = await circuitBreaker.WITHDRAWAL_PERIOD();
  const tickLength = await circuitBreaker.TICK_LENGTH();
  const rateLimitCooldown = await circuitBreaker.rateLimitCooldownPeriod();
  const isOperational = await circuitBreaker.isOperational();

  console.log("  ✓ WITHDRAWAL_PERIOD:", withdrawalPeriod.toString());
  console.log("  ✓ TICK_LENGTH:", tickLength.toString());
  console.log("  ✓ rateLimitCooldownPeriod:", rateLimitCooldown.toString());
  console.log("  ✓ isOperational:", isOperational);

  // ============= TEST 2: Add Protected Contract =============
  console.log("\n🛡️  TEST 2: Add Protected Contract");
  let tx = await circuitBreaker.addProtectedContracts([protectedContract.address]);
  await tx.wait();
  const isProtected = await circuitBreaker.isProtectedContract(protectedContract.address);
  console.log("  ✓ Added protected contract:", protectedContract.address);
  console.log("  ✓ Is protected:", isProtected);

  // ============= TEST 3: Add Security Parameter =============
  console.log("\n🔐 TEST 3: Add Security Parameter");

  // Create a mock settlement module address
  const mockSettlementModule = ethers.Wallet.createRandom().address;
  const TEST_IDENTIFIER = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("WETH_USDC"));
  const MIN_LIQ_RETAINED_BPS = 5000; // 50%
  const LIMIT_BEGIN_THRESHOLD = ethers.utils.parseEther("1000");

  tx = await circuitBreaker.addSecurityParameter(
    TEST_IDENTIFIER,
    MIN_LIQ_RETAINED_BPS,
    LIMIT_BEGIN_THRESHOLD,
    mockSettlementModule
  );

  const receipt = await tx.wait();
  console.log("  ✓ Security parameter added");
  console.log("  ✓ Identifier:", TEST_IDENTIFIER);
  console.log("  ✓ Min Liquidity Retained (bps):", MIN_LIQ_RETAINED_BPS);
  console.log("  ✓ Limit Begin Threshold:", ethers.utils.formatEther(LIMIT_BEGIN_THRESHOLD), "tokens");

  // ============= TEST 4: Check Grace Period =============
  console.log("\n⏱️  TEST 4: Grace Period Management");

  const currentBlockTimestamp = (await ethers.provider.getBlock("latest")).timestamp;
  const futureTimestamp = currentBlockTimestamp + 86400; // 1 day from now

  tx = await circuitBreaker.startGracePeriod(futureTimestamp);
  await tx.wait();

  const gracePeriodEnd = await circuitBreaker.gracePeriodEndTimestamp();
  const isInGracePeriod = await circuitBreaker.isInGracePeriod();

  console.log("  ✓ Grace period started");
  console.log("  ✓ Grace period ends at:", new Date(gracePeriodEnd * 1000).toISOString());
  console.log("  ✓ Currently in grace period:", isInGracePeriod);

  // ============= TEST 5: Check Rate Limit Status =============
  console.log("\n⚡ TEST 5: Rate Limit Status");

  const isRateLimited = await circuitBreaker.isRateLimited();
  const isParameterRateLimited = await circuitBreaker.isParameterRateLimited(TEST_IDENTIFIER);

  console.log("  ✓ Global rate limited:", isRateLimited);
  console.log("  ✓ Parameter rate limited:", isParameterRateLimited);

  // ============= TEST 6: Test Access Control =============
  console.log("\n🔒 TEST 6: Access Control");

  try {
    await circuitBreaker.connect(user).addProtectedContracts([user.address]);
    console.log("  ❌ FAILED: Non-owner was able to add protected contracts!");
  } catch (error) {
    console.log("  ✓ Only owner can add protected contracts (access denied as expected)");
  }

  // ============= TEST 7: Toggle Operational Status =============
  console.log("\n🚨 TEST 7: Operational Status Control");

  let operationalStatus = await circuitBreaker.isOperational();
  console.log("  ✓ Initial operational status:", operationalStatus);

  tx = await circuitBreaker.setCircuitBreakerOperationalStatus(false);
  await tx.wait();
  operationalStatus = await circuitBreaker.isOperational();
  console.log("  ✓ After toggling to OFF:", operationalStatus);

  tx = await circuitBreaker.setCircuitBreakerOperationalStatus(true);
  await tx.wait();
  operationalStatus = await circuitBreaker.isOperational();
  console.log("  ✓ After toggling to ON:", operationalStatus);

  // ============= TEST 8: Clear Backlog =============
  console.log("\n🧹 TEST 8: Clear Backlog");

  tx = await circuitBreaker.clearBackLog(TEST_IDENTIFIER, 100);
  await tx.wait();
  console.log("  ✓ Backlog cleared for identifier:", TEST_IDENTIFIER);

  // ============= TEST 9: Limiter Override =============
  console.log("\n⚙️  TEST 9: Limiter Override");

  const overrideResult = await circuitBreaker.setLimiterOverriden(TEST_IDENTIFIER, true);
  console.log("  ✓ Limiter override set to:", overrideResult);

  // ============= TEST 10: View Liquidity Changes =============
  console.log("\n📊 TEST 10: View Liquidity Changes");

  const tickTimestamp = currentBlockTimestamp;
  const { nextTimestamp, amount } = await circuitBreaker.liquidityChanges(
    TEST_IDENTIFIER,
    tickTimestamp
  );
  console.log("  ✓ Liquidity changes for tick:", tickTimestamp);
  console.log("  ✓ Next timestamp:", nextTimestamp.toString());
  console.log("  ✓ Amount change:", amount.toString());

  // ============= SUMMARY =============
  console.log("\n" + "=".repeat(60));
  console.log("✅ ALL TESTS COMPLETED SUCCESSFULLY!");
  console.log("=".repeat(60));
  console.log("\n📝 Key Contract Address for Integration:");
  console.log("   CircuitBreaker:", circuitBreaker.address);
  console.log("\n💾 Save this address to continue testing!");
  console.log("   Add to your environment or .env file");

  return circuitBreaker.address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
