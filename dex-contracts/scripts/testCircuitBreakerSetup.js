/**
 * Complete CircuitBreaker Setup & Testing Script
 * Run: npx hardhat run scripts/testCircuitBreakerSetup.js --network coston2
 */

const hre = require("hardhat");
const ethers = hre.ethers;

const CIRCUIT_BREAKER = "0x158539ED915830ab0d0b5feC55CE68E1e2A32350";
const MULTIDEX = "0x86B31797B79cF963a5fCD5451753289CF7668fD4";
const WETH = "0x7EF7C01051fEA0664ca3aa834934B46493905f19";
const USDC = "0xa47a8F4032bcAa9E6613546D2B2B3A37E19853c7";

const CB_ABI = [
  "function addProtectedContracts(address[] calldata) external",
  "function addSecurityParameter(bytes32, uint256, uint256, address) external",
  "function isProtectedContract(address) public view returns (bool)",
  "function isParameterRateLimited(bytes32) external view returns (bool)",
  "function isOperational() public view returns (bool)",
  "function owner() public view returns (address)",
  "function startGracePeriod(uint256) external",
  "function setCircuitBreakerOperationalStatus(bool) external",
];

async function main() {
  console.log("🚀 CircuitBreaker Complete Setup & Testing\n");

  const [signer] = await ethers.getSigners();
  console.log("📍 Account:", signer.address);
  console.log("🔗 Network: Flare Coston2\n");

  const cb = new ethers.Contract(CIRCUIT_BREAKER, CB_ABI, signer);

  // Check if owner
  const owner = await cb.owner();
  const isOwner = owner.toLowerCase() === signer.address.toLowerCase();
  console.log("👤 Owner:", owner);
  console.log("🔑 You are owner:", isOwner ? "YES ✅" : "NO ⚠️");

  if (!isOwner) {
    console.log(
      "\n⚠️  WARNING: You are not the owner. Some functions will fail."
    );
    console.log("Only the owner can:");
    console.log("  - Add protected contracts");
    console.log("  - Add security parameters");
    console.log("  - Control operational status");
    return;
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ STEP 1: Add MultiDEX as Protected Contract");
  console.log("=".repeat(60));

  try {
    const isProtected = await cb.isProtectedContract(MULTIDEX);
    console.log("Already protected:", isProtected);

    if (!isProtected) {
      console.log("⏳ Adding MultiDEX...");
      const tx = await cb.addProtectedContracts([MULTIDEX]);
      const receipt = await tx.wait();
      console.log("✅ Added! Tx:", tx.hash);
    }

    const newStatus = await cb.isProtectedContract(MULTIDEX);
    console.log("✓ MultiDEX is now protected:", newStatus);
  } catch (error) {
    console.log("❌ Error:", error.message);
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ STEP 2: Add Security Parameters for WETH_USDC");
  console.log("=".repeat(60));

  try {
    const pairId = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes("WETH_USDC")
    );
    const minLiqBps = 5000; // 50%
    const threshold = ethers.utils.parseEther("1000"); // 1000 tokens
    const mockSettlement = ethers.Wallet.createRandom().address;

    console.log("📝 Parameters:");
    console.log("  Pair ID:", pairId);
    console.log("  Min Liquidity:", minLiqBps, "bps (50%)");
    console.log("  Threshold:", ethers.utils.formatEther(threshold), "tokens");
    console.log("  Settlement Module:", mockSettlement);

    console.log("\n⏳ Adding security parameter...");
    const tx = await cb.addSecurityParameter(
      pairId,
      minLiqBps,
      threshold,
      mockSettlement
    );
    const receipt = await tx.wait();
    console.log("✅ Added! Tx:", tx.hash);

    const isRateLimited = await cb.isParameterRateLimited(pairId);
    console.log("✓ Parameter rate limited status:", isRateLimited);
  } catch (error) {
    console.log("❌ Error:", error.message);
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ STEP 3: Check Circuit Breaker Status");
  console.log("=".repeat(60));

  try {
    const isOperational = await cb.isOperational();
    console.log("✓ Operational:", isOperational ? "YES ✅" : "NO ❌");

    if (!isOperational) {
      console.log("⏳ Enabling circuit breaker...");
      const tx = await cb.setCircuitBreakerOperationalStatus(true);
      await tx.wait();
      console.log("✅ Enabled!");
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ STEP 4: Set Grace Period (Optional)");
  console.log("=".repeat(60));

  try {
    const currentBlock = await ethers.provider.getBlock("latest");
    const now = currentBlock.timestamp;
    const gracePeriodEnd = now + 2 * 24 * 60 * 60; // 2 days

    console.log("Current time:", new Date(now * 1000).toISOString());
    console.log(
      "Grace period end:",
      new Date(gracePeriodEnd * 1000).toISOString()
    );

    console.log("\n⏳ Setting grace period...");
    const tx = await cb.startGracePeriod(gracePeriodEnd);
    await tx.wait();
    console.log("✅ Grace period set! Tx:", tx.hash);
  } catch (error) {
    console.log("❌ Error:", error.message);
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ ALL SETUP COMPLETED SUCCESSFULLY!");
  console.log("=".repeat(60));

  console.log("\n📊 Summary of Deployed Configuration:");
  console.log("  CircuitBreaker: " + CIRCUIT_BREAKER);
  console.log("  MultiDEX (Protected): " + MULTIDEX);
  console.log("  WETH: " + WETH);
  console.log("  USDC: " + USDC);

  console.log("\n🎯 Next Steps:");
  console.log("  1. Integrate CircuitBreaker calls into your DEX:");
  console.log("     - Call increaseParameter() on deposits");
  console.log("     - Call decreaseParameter() on withdrawals");
  console.log("  2. Monitor for rate limit triggers");
  console.log("  3. Implement recovery mechanism");
  console.log("  4. Test with real swaps/liquidity");

  console.log("\n📚 Documentation:");
  console.log("  - Integration Guide: CIRCUITBREAKER_INTEGRATION_GUIDE.md");
  console.log("  - Testing Guide: CIRCUITBREAKER_TESTING_GUIDE.md");
}

main()
  .then(() => {
    console.log("\n✨ Setup complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Setup failed:", error.message);
    process.exit(1);
  });
