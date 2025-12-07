/**
 * CircuitBreaker Deployment Script
 * Deploy to Coston2 Testnet
 * Run: npx hardhat run scripts/deployCircuitBreaker.js --network coston2
 */

const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying CircuitBreaker to Coston2 Testnet...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying with account:", deployer.address);

  // Check account balance
  const balance = await deployer.getBalance();
  console.log("💰 Account balance:", hre.ethers.utils.formatEther(balance), "FLR");

  if (balance.isZero()) {
    console.log("❌ ERROR: Account has no FLR balance. Please fund the account first!");
    process.exit(1);
  }

  // Constructor parameters (optimized for 2-day testing)
  const RATE_LIMIT_COOLDOWN = 3600; // 1 hour - faster recovery for testing
  const WITHDRAWAL_PERIOD = 172800; // 2 days - matches test window
  const LIQUIDITY_TICK_LENGTH = 600; // 10 minutes - granular tracking

  console.log("\n⚙️  Constructor Parameters:");
  console.log("  RATE_LIMIT_COOLDOWN:", RATE_LIMIT_COOLDOWN, "seconds (1 hour)");
  console.log("  WITHDRAWAL_PERIOD:", WITHDRAWAL_PERIOD, "seconds (2 days)");
  console.log("  LIQUIDITY_TICK_LENGTH:", LIQUIDITY_TICK_LENGTH, "seconds (10 minutes)");
  console.log("  Owner:", deployer.address);

  // Deploy CircuitBreaker
  const CircuitBreaker = await hre.ethers.getContractFactory("CircuitBreaker");
  console.log("\n⏳ Deploying contract...");

  const circuitBreaker = await CircuitBreaker.deploy(
    RATE_LIMIT_COOLDOWN,
    WITHDRAWAL_PERIOD,
    LIQUIDITY_TICK_LENGTH,
    deployer.address
  );

  console.log("📦 Waiting for deployment transaction...");
  await circuitBreaker.deployed();

  console.log("\n✅ CircuitBreaker deployed successfully!");
  console.log("📄 Contract Address:", circuitBreaker.address);
  console.log("🔗 View on block explorer:");
  console.log("   https://coston2-explorer.flare.network/address/" + circuitBreaker.address);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const owner = await circuitBreaker.owner();
  const isOperational = await circuitBreaker.isOperational();
  const withdrawalPeriod = await circuitBreaker.WITHDRAWAL_PERIOD();

  console.log("  ✓ Owner:", owner);
  console.log("  ✓ Operational:", isOperational);
  console.log("  ✓ Withdrawal Period:", withdrawalPeriod.toString());

  // Save deployment info
  console.log("\n💾 Deployment Information:");
  console.log("=====================================");
  console.log("Contract: CircuitBreaker");
  console.log("Network: Flare Coston2 (Chain ID: 114)");
  console.log("Address: " + circuitBreaker.address);
  console.log("Deployer: " + deployer.address);
  console.log("Transaction Hash: " + (await circuitBreaker.deployTransaction.hash));
  console.log("Block Number: " + (await circuitBreaker.deployTransaction.blockNumber));
  console.log("=====================================");

  console.log("\n📝 Next Steps:");
  console.log("1. Save the contract address:", circuitBreaker.address);
  console.log("2. Add protected contracts using: addProtectedContracts()");
  console.log("3. Add security parameters using: addSecurityParameter()");
  console.log("4. Start monitoring transactions");

  // Return address for use in other scripts
  return circuitBreaker.address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
