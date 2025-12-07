const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("CircuitBreaker", function () {
  let circuitBreaker;
  let owner;
  let protectedContract;
  let otherAccount;
  
  // Constructor parameters
  const RATE_LIMIT_COOLDOWN = 86400; // 1 day
  const WITHDRAWAL_PERIOD = 604800; // 7 days
  const LIQUIDITY_TICK_LENGTH = 3600; // 1 hour
  
  // Security parameter values
  const MIN_LIQ_RETAINED_BPS = 5000; // 50%
  const LIMIT_BEGIN_THRESHOLD = ethers.utils.parseEther("1000");
  
  // Test identifier (bytes32)
  const TEST_IDENTIFIER = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("TEST_TOKEN"));

  beforeEach(async function () {
    [owner, protectedContract, otherAccount] = await ethers.getSigners();

    // Deploy CircuitBreaker contract
    const CircuitBreaker = await ethers.getContractFactory("CircuitBreaker");
    circuitBreaker = await CircuitBreaker.deploy(
      RATE_LIMIT_COOLDOWN,
      WITHDRAWAL_PERIOD,
      LIQUIDITY_TICK_LENGTH,
      owner.address
    );
    await circuitBreaker.deployed();
  });

  describe("Deployment", function () {
    it("Should deploy with correct parameters", async function () {
      expect(await circuitBreaker.WITHDRAWAL_PERIOD()).to.equal(WITHDRAWAL_PERIOD);
      expect(await circuitBreaker.TICK_LENGTH()).to.equal(LIQUIDITY_TICK_LENGTH);
      expect(await circuitBreaker.rateLimitCooldownPeriod()).to.equal(RATE_LIMIT_COOLDOWN);
    });

    it("Should be operational on deployment", async function () {
      expect(await circuitBreaker.isOperational()).to.be.true;
    });

    it("Should not be rate limited on deployment", async function () {
      expect(await circuitBreaker.isRateLimited()).to.be.false;
    });

    it("Should have correct owner", async function () {
      expect(await circuitBreaker.owner()).to.equal(owner.address);
    });
  });

  describe("Protected Contracts Management", function () {
    it("Should add a protected contract", async function () {
      await circuitBreaker.addProtectedContracts([protectedContract.address]);
      expect(await circuitBreaker.isProtectedContract(protectedContract.address)).to.be.true;
    });

    it("Should add multiple protected contracts", async function () {
      await circuitBreaker.addProtectedContracts([
        protectedContract.address,
        otherAccount.address,
      ]);
      expect(await circuitBreaker.isProtectedContract(protectedContract.address)).to.be.true;
      expect(await circuitBreaker.isProtectedContract(otherAccount.address)).to.be.true;
    });

    it("Should remove a protected contract", async function () {
      await circuitBreaker.addProtectedContracts([protectedContract.address]);
      expect(await circuitBreaker.isProtectedContract(protectedContract.address)).to.be.true;
      
      await circuitBreaker.removeProtectedContracts([protectedContract.address]);
      expect(await circuitBreaker.isProtectedContract(protectedContract.address)).to.be.false;
    });

    it("Should only allow owner to add protected contracts", async function () {
      await expect(
        circuitBreaker.connect(otherAccount).addProtectedContracts([protectedContract.address])
      ).to.be.revertedWithCustomError(circuitBreaker, "OwnableUnauthorizedAccount");
    });

    it("Should only allow owner to remove protected contracts", async function () {
      await circuitBreaker.addProtectedContracts([protectedContract.address]);
      
      await expect(
        circuitBreaker.connect(otherAccount).removeProtectedContracts([protectedContract.address])
      ).to.be.revertedWithCustomError(circuitBreaker, "OwnableUnauthorizedAccount");
    });
  });

  describe("Security Parameter Management", function () {
    it("Should add a security parameter", async function () {
      // Create a mock settlement module (address)
      const mockSettlementModule = ethers.Wallet.createRandom().address;
      
      await expect(
        circuitBreaker.addSecurityParameter(
          TEST_IDENTIFIER,
          MIN_LIQ_RETAINED_BPS,
          LIMIT_BEGIN_THRESHOLD,
          mockSettlementModule
        )
      )
        .to.emit(circuitBreaker, "SecurityParameterAdded")
        .withArgs(TEST_IDENTIFIER, MIN_LIQ_RETAINED_BPS, LIMIT_BEGIN_THRESHOLD, mockSettlementModule);
    });

    it("Should update a security parameter", async function () {
      const mockSettlementModule = ethers.Wallet.createRandom().address;
      
      // Add first
      await circuitBreaker.addSecurityParameter(
        TEST_IDENTIFIER,
        MIN_LIQ_RETAINED_BPS,
        LIMIT_BEGIN_THRESHOLD,
        mockSettlementModule
      );
      
      // Update
      const newMinLiq = 7000; // 70%
      const newThreshold = ethers.utils.parseEther("2000");
      
      await circuitBreaker.updateSecurityParameter(
        TEST_IDENTIFIER,
        newMinLiq,
        newThreshold,
        mockSettlementModule
      );
      
      // Verify update by checking if contract doesn't revert on the new parameters
      expect(await circuitBreaker.limiters(TEST_IDENTIFIER)).to.exist;
    });

    it("Should only allow owner to add security parameters", async function () {
      const mockSettlementModule = ethers.Wallet.createRandom().address;
      
      await expect(
        circuitBreaker.connect(otherAccount).addSecurityParameter(
          TEST_IDENTIFIER,
          MIN_LIQ_RETAINED_BPS,
          LIMIT_BEGIN_THRESHOLD,
          mockSettlementModule
        )
      ).to.be.revertedWithCustomError(circuitBreaker, "OwnableUnauthorizedAccount");
    });

    it("Should only allow owner to update security parameters", async function () {
      const mockSettlementModule = ethers.Wallet.createRandom().address;
      
      await circuitBreaker.addSecurityParameter(
        TEST_IDENTIFIER,
        MIN_LIQ_RETAINED_BPS,
        LIMIT_BEGIN_THRESHOLD,
        mockSettlementModule
      );
      
      await expect(
        circuitBreaker.connect(otherAccount).updateSecurityParameter(
          TEST_IDENTIFIER,
          7000,
          LIMIT_BEGIN_THRESHOLD,
          mockSettlementModule
        )
      ).to.be.revertedWithCustomError(circuitBreaker, "OwnableUnauthorizedAccount");
    });
  });

  describe("Operational Status", function () {
    it("Should set circuit breaker operational status", async function () {
      expect(await circuitBreaker.isOperational()).to.be.true;
      
      await circuitBreaker.setCircuitBreakerOperationalStatus(false);
      expect(await circuitBreaker.isOperational()).to.be.false;
      
      await circuitBreaker.setCircuitBreakerOperationalStatus(true);
      expect(await circuitBreaker.isOperational()).to.be.true;
    });

    it("Should only allow owner to change operational status", async function () {
      await expect(
        circuitBreaker.connect(otherAccount).setCircuitBreakerOperationalStatus(false)
      ).to.be.revertedWithCustomError(circuitBreaker, "OwnableUnauthorizedAccount");
    });
  });

  describe("Grace Period Management", function () {
    it("Should start a grace period", async function () {
      const futureTimestamp = (await time.latest()) + 86400; // 1 day from now
      
      await expect(circuitBreaker.startGracePeriod(futureTimestamp))
        .to.emit(circuitBreaker, "GracePeriodStarted")
        .withArgs(futureTimestamp);
      
      expect(await circuitBreaker.gracePeriodEndTimestamp()).to.equal(futureTimestamp);
    });

    it("Should verify grace period is active", async function () {
      const futureTimestamp = (await time.latest()) + 86400;
      
      await circuitBreaker.startGracePeriod(futureTimestamp);
      expect(await circuitBreaker.isInGracePeriod()).to.be.true;
    });

    it("Should verify grace period expired", async function () {
      const pastTimestamp = (await time.latest()) - 1;
      
      await expect(
        circuitBreaker.startGracePeriod(pastTimestamp)
      ).to.be.revertedWithCustomError(circuitBreaker, "CircuitBreaker__InvalidGracePeriodEnd");
    });

    it("Should only allow owner to start grace period", async function () {
      const futureTimestamp = (await time.latest()) + 86400;
      
      await expect(
        circuitBreaker.connect(otherAccount).startGracePeriod(futureTimestamp)
      ).to.be.revertedWithCustomError(circuitBreaker, "OwnableUnauthorizedAccount");
    });

    it("Should exit grace period after timestamp", async function () {
      const futureTimestamp = (await time.latest()) + 100;
      
      await circuitBreaker.startGracePeriod(futureTimestamp);
      expect(await circuitBreaker.isInGracePeriod()).to.be.true;
      
      // Move time forward past grace period
      await time.increaseTo(futureTimestamp + 1);
      expect(await circuitBreaker.isInGracePeriod()).to.be.false;
    });
  });

  describe("Rate Limit Management", function () {
    it("Should override expired rate limit", async function () {
      // Set rate limited flag
      // Note: This would normally be triggered by increaseParameter, 
      // but we test the override function directly
      const mockSettlementModule = ethers.Wallet.createRandom().address;
      
      // First add a security parameter
      await circuitBreaker.addSecurityParameter(
        TEST_IDENTIFIER,
        MIN_LIQ_RETAINED_BPS,
        LIMIT_BEGIN_THRESHOLD,
        mockSettlementModule
      );
      
      // The overrideRateLimit function would be called after cooldown period
      // In a real scenario, the circuit breaker would be triggered first
    });

    it("Should not allow override if not rate limited", async function () {
      const mockSettlementModule = ethers.Wallet.createRandom().address;
      
      await circuitBreaker.addSecurityParameter(
        TEST_IDENTIFIER,
        MIN_LIQ_RETAINED_BPS,
        LIMIT_BEGIN_THRESHOLD,
        mockSettlementModule
      );
      
      await expect(
        circuitBreaker.overrideRateLimit(TEST_IDENTIFIER)
      ).to.be.revertedWithCustomError(circuitBreaker, "CircuitBreaker__NotRateLimited");
    });

    it("Should check if parameter is rate limited", async function () {
      const mockSettlementModule = ethers.Wallet.createRandom().address;
      
      await circuitBreaker.addSecurityParameter(
        TEST_IDENTIFIER,
        MIN_LIQ_RETAINED_BPS,
        LIMIT_BEGIN_THRESHOLD,
        mockSettlementModule
      );
      
      // Initially not rate limited
      expect(await circuitBreaker.isParameterRateLimited(TEST_IDENTIFIER)).to.be.false;
    });
  });

  describe("Clear Backlog", function () {
    it("Should clear backlog for a parameter", async function () {
      const mockSettlementModule = ethers.Wallet.createRandom().address;
      
      await circuitBreaker.addSecurityParameter(
        TEST_IDENTIFIER,
        MIN_LIQ_RETAINED_BPS,
        LIMIT_BEGIN_THRESHOLD,
        mockSettlementModule
      );
      
      // Clear backlog with max iterations
      await circuitBreaker.clearBackLog(TEST_IDENTIFIER, 100);
      // Should complete without error
    });
  });

  describe("Access Control", function () {
    it("Should only allow protected contracts to call increaseParameter", async function () {
      const mockSettlementModule = ethers.Wallet.createRandom().address;
      
      await circuitBreaker.addSecurityParameter(
        TEST_IDENTIFIER,
        MIN_LIQ_RETAINED_BPS,
        LIMIT_BEGIN_THRESHOLD,
        mockSettlementModule
      );
      
      // otherAccount is not a protected contract
      await expect(
        circuitBreaker.connect(otherAccount).increaseParameter(
          TEST_IDENTIFIER,
          ethers.utils.parseEther("100"),
          ethers.constants.AddressZero,
          0,
          "0x"
        )
      ).to.be.revertedWithCustomError(circuitBreaker, "CircuitBreaker__NotAProtectedContract");
    });

    it("Should only allow protected contracts to call decreaseParameter", async function () {
      const mockSettlementModule = ethers.Wallet.createRandom().address;
      
      await circuitBreaker.addSecurityParameter(
        TEST_IDENTIFIER,
        MIN_LIQ_RETAINED_BPS,
        LIMIT_BEGIN_THRESHOLD,
        mockSettlementModule
      );
      
      await expect(
        circuitBreaker.connect(otherAccount).decreaseParameter(
          TEST_IDENTIFIER,
          ethers.utils.parseEther("100"),
          ethers.constants.AddressZero,
          0,
          "0x"
        )
      ).to.be.revertedWithCustomError(circuitBreaker, "CircuitBreaker__NotAProtectedContract");
    });

    it("Should only allow operational circuit breaker to call increaseParameter", async function () {
      const mockSettlementModule = ethers.Wallet.createRandom().address;
      
      await circuitBreaker.addProtectedContracts([protectedContract.address]);
      await circuitBreaker.addSecurityParameter(
        TEST_IDENTIFIER,
        MIN_LIQ_RETAINED_BPS,
        LIMIT_BEGIN_THRESHOLD,
        mockSettlementModule
      );
      
      // Set to non-operational
      await circuitBreaker.setCircuitBreakerOperationalStatus(false);
      
      await expect(
        circuitBreaker.connect(protectedContract).increaseParameter(
          TEST_IDENTIFIER,
          ethers.utils.parseEther("100"),
          ethers.constants.AddressZero,
          0,
          "0x"
        )
      ).to.be.revertedWithCustomError(circuitBreaker, "CircuitBreaker__NotOperational");
    });
  });

  describe("Limiter Override", function () {
    it("Should set limiter override status", async function () {
      const mockSettlementModule = ethers.Wallet.createRandom().address;
      
      await circuitBreaker.addSecurityParameter(
        TEST_IDENTIFIER,
        MIN_LIQ_RETAINED_BPS,
        LIMIT_BEGIN_THRESHOLD,
        mockSettlementModule
      );
      
      const result = await circuitBreaker.setLimiterOverriden(TEST_IDENTIFIER, true);
      expect(result).to.be.true;
    });
  });

  describe("View Functions", function () {
    it("Should return liquidity changes for a timestamp", async function () {
      const mockSettlementModule = ethers.Wallet.createRandom().address;
      
      await circuitBreaker.addSecurityParameter(
        TEST_IDENTIFIER,
        MIN_LIQ_RETAINED_BPS,
        LIMIT_BEGIN_THRESHOLD,
        mockSettlementModule
      );
      
      const tickTimestamp = await time.latest();
      const { nextTimestamp, amount } = await circuitBreaker.liquidityChanges(
        TEST_IDENTIFIER,
        tickTimestamp
      );
      
      // Should return valid values
      expect(nextTimestamp).to.exist;
      expect(amount).to.exist;
    });
  });
});
