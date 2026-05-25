const { expect } = require("chai");
const { ethers } = require("hardhat");

// ─────────────────────────────────────────────────────────────────────────────
// Mock contracts deployed inline for testing
// ─────────────────────────────────────────────────────────────────────────────

describe("SonicAggregatorRouter", function () {
  let router;
  let owner, user, feeRecipient;
  let mockWS, mockTokenA, mockTokenB;
  let mockFactory, mockPair;
  let mockDexRouter;

  // ──────────────────────────────────────────────────
  // Deploy helpers
  // ──────────────────────────────────────────────────

  async function deployMockERC20(name, symbol, decimals = 18) {
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    return MockERC20.deploy(name, symbol, decimals);
  }

  async function deployMockWETH() {
    const MockWETH = await ethers.getContractFactory("MockWETH");
    return MockWETH.deploy();
  }

  async function deployMockFactory(tokenA, tokenB, pairAddress) {
    const MockFactory = await ethers.getContractFactory("MockUniswapV2Factory");
    return MockFactory.deploy(tokenA, tokenB, pairAddress);
  }

  async function deployMockPair(token0, token1, reserve0, reserve1) {
    const MockPair = await ethers.getContractFactory("MockUniswapV2Pair");
    return MockPair.deploy(token0, token1, reserve0, reserve1);
  }

  async function deployMockRouter(factoryAddress, wsAddress) {
    const MockRouter = await ethers.getContractFactory("MockUniswapV2Router");
    return MockRouter.deploy(factoryAddress, wsAddress);
  }

  // ──────────────────────────────────────────────────
  // Fixture
  // ──────────────────────────────────────────────────

  beforeEach(async function () {
    [owner, user, feeRecipient] = await ethers.getSigners();

    // Deploy mock tokens
    mockWS = await deployMockWETH();
    mockTokenA = await deployMockERC20("Token A", "TKNA");
    mockTokenB = await deployMockERC20("Token B", "TKNB");

    const wsAddress = await mockWS.getAddress();
    const tokenAAddress = await mockTokenA.getAddress();
    const tokenBAddress = await mockTokenB.getAddress();

    // Deploy mock pair with 100_000 units each side
    const reserve = ethers.parseEther("100000");
    mockPair = await deployMockPair(tokenAAddress, tokenBAddress, reserve, reserve);
    const pairAddress = await mockPair.getAddress();

    // Deploy mock factory
    mockFactory = await deployMockFactory(tokenAAddress, tokenBAddress, pairAddress);
    const factoryAddress = await mockFactory.getAddress();

    // Deploy mock router
    mockDexRouter = await deployMockRouter(factoryAddress, wsAddress);
    const dexRouterAddress = await mockDexRouter.getAddress();

    // Deploy aggregator router
    const SonicAggregatorRouter = await ethers.getContractFactory("SonicAggregatorRouter");
    router = await SonicAggregatorRouter.deploy(wsAddress, owner.address);

    // Register the mock DEX
    await router.addDex(factoryAddress, dexRouterAddress, "MockDEX");
  });

  // ──────────────────────────────────────────────────
  // Deployment
  // ──────────────────────────────────────────────────

  describe("Deployment", function () {
    it("Sets wS address correctly", async function () {
      expect(await router.WS()).to.equal(await mockWS.getAddress());
    });

    it("Sets owner correctly", async function () {
      expect(await router.owner()).to.equal(owner.address);
    });

    it("Starts with zero dexes if none added in constructor", async function () {
      const SonicAggregatorRouter = await ethers.getContractFactory("SonicAggregatorRouter");
      const freshRouter = await SonicAggregatorRouter.deploy(await mockWS.getAddress(), owner.address);
      expect(await freshRouter.getDexCount()).to.equal(0);
    });

    it("Reverts on zero wS address", async function () {
      const SonicAggregatorRouter = await ethers.getContractFactory("SonicAggregatorRouter");
      await expect(
        SonicAggregatorRouter.deploy(ethers.ZeroAddress, owner.address)
      ).to.be.revertedWith("SonicAggregatorRouter: zero wS address");
    });
  });

  // ──────────────────────────────────────────────────
  // DEX management
  // ──────────────────────────────────────────────────

  describe("DEX management", function () {
    it("Owner can add a DEX", async function () {
      const factoryAddr = await mockFactory.getAddress();
      const routerAddr = await mockDexRouter.getAddress();

      await expect(router.addDex(factoryAddr, routerAddr, "AnotherDEX"))
        .to.emit(router, "DexAdded");

      expect(await router.getDexCount()).to.equal(2);
    });

    it("Non-owner cannot add a DEX", async function () {
      await expect(
        router.connect(user).addDex(await mockFactory.getAddress(), await mockDexRouter.getAddress(), "DEX")
      ).to.be.revertedWithCustomError(router, "OwnableUnauthorizedAccount");
    });

    it("Owner can remove a DEX", async function () {
      await expect(router.removeDex(0)).to.emit(router, "DexRemoved").withArgs(0, "MockDEX");
    });

    it("Non-owner cannot remove a DEX", async function () {
      await expect(router.connect(user).removeDex(0))
        .to.be.revertedWithCustomError(router, "OwnableUnauthorizedAccount");
    });

    it("Owner can set dex active/inactive", async function () {
      await expect(router.setDexActive(0, false)).to.emit(router, "DexUpdated").withArgs(0, false);
      const [, , , active] = await router.dexList(0);
      expect(active).to.be.false;
    });

    it("Cannot add DEX with zero factory address", async function () {
      await expect(
        router.addDex(ethers.ZeroAddress, await mockDexRouter.getAddress(), "DEX")
      ).to.be.revertedWith("SonicAggregatorRouter: zero factory");
    });

    it("Cannot add DEX with zero router address", async function () {
      await expect(
        router.addDex(await mockFactory.getAddress(), ethers.ZeroAddress, "DEX")
      ).to.be.revertedWith("SonicAggregatorRouter: zero router");
    });

    it("Owner can update min liquidity threshold", async function () {
      const newThreshold = ethers.parseEther("50000");
      await expect(router.setMinLiquidityThreshold(newThreshold))
        .to.emit(router, "MinLiquidityThresholdUpdated");
      expect(await router.minLiquidityThreshold()).to.equal(newThreshold);
    });
  });

  // ──────────────────────────────────────────────────
  // getAmountsOut view
  // ──────────────────────────────────────────────────

  describe("getAmountsOut", function () {
    it("Returns output amounts for a valid path", async function () {
      const tokenAAddr = await mockTokenA.getAddress();
      const tokenBAddr = await mockTokenB.getAddress();
      const amountIn = ethers.parseEther("1");

      const amounts = await router.getAmountsOut(amountIn, [tokenAAddr, tokenBAddr], 0);
      expect(amounts.length).to.equal(2);
      expect(amounts[0]).to.equal(amountIn);
      expect(amounts[1]).to.be.gt(0);
    });

    it("Reverts for invalid dex index", async function () {
      const tokenAAddr = await mockTokenA.getAddress();
      const tokenBAddr = await mockTokenB.getAddress();

      await expect(
        router.getAmountsOut(ethers.parseEther("1"), [tokenAAddr, tokenBAddr], 99)
      ).to.be.revertedWith("SonicAggregatorRouter: invalid dex index");
    });
  });

  // ──────────────────────────────────────────────────
  // getBestRoute view
  // ──────────────────────────────────────────────────

  describe("getBestRoute", function () {
    it("Returns a valid route for a token pair", async function () {
      const tokenAAddr = await mockTokenA.getAddress();
      const tokenBAddr = await mockTokenB.getAddress();
      const amountIn = ethers.parseEther("1");

      const route = await router.getBestRoute(amountIn, tokenAAddr, tokenBAddr);
      expect(route.amountOut).to.be.gt(0);
      expect(route.dexName).to.equal("MockDEX");
      expect(route.path[0]).to.equal(tokenAAddr);
      expect(route.path[route.path.length - 1]).to.equal(tokenBAddr);
    });

    it("Reverts when no route is available (dex removed)", async function () {
      await router.removeDex(0);
      const tokenAAddr = await mockTokenA.getAddress();
      const tokenBAddr = await mockTokenB.getAddress();

      await expect(
        router.getBestRoute(ethers.parseEther("1"), tokenAAddr, tokenBAddr)
      ).to.be.revertedWith("SonicAggregatorRouter: no valid route found");
    });
  });

  // ──────────────────────────────────────────────────
  // swapExactTokensForTokens
  // ──────────────────────────────────────────────────

  describe("swapExactTokensForTokens", function () {
    beforeEach(async function () {
      // Fund user and mock DEX router
      const amount = ethers.parseEther("1000");
      await mockTokenA.mint(user.address, amount);
      await mockTokenB.mint(await mockDexRouter.getAddress(), amount);
      await mockTokenA.connect(user).approve(await router.getAddress(), amount);
    });

    it("Swaps tokens and emits Swapped event", async function () {
      const tokenAAddr = await mockTokenA.getAddress();
      const tokenBAddr = await mockTokenB.getAddress();
      const amountIn = ethers.parseEther("10");
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      const userBefore = await mockTokenB.balanceOf(user.address);

      await expect(
        router.connect(user).swapExactTokensForTokens(
          amountIn,
          1n,
          tokenAAddr,
          tokenBAddr,
          user.address,
          deadline
        )
      ).to.emit(router, "Swapped");

      const userAfter = await mockTokenB.balanceOf(user.address);
      expect(userAfter).to.be.gt(userBefore);
    });

    it("Reverts when deadline has passed", async function () {
      const tokenAAddr = await mockTokenA.getAddress();
      const tokenBAddr = await mockTokenB.getAddress();
      const expiredDeadline = 1; // past

      await expect(
        router.connect(user).swapExactTokensForTokens(
          ethers.parseEther("1"),
          1n,
          tokenAAddr,
          tokenBAddr,
          user.address,
          expiredDeadline
        )
      ).to.be.revertedWith("SonicAggregatorRouter: expired");
    });

    it("Reverts when amountIn is zero", async function () {
      const tokenAAddr = await mockTokenA.getAddress();
      const tokenBAddr = await mockTokenB.getAddress();
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      await expect(
        router.connect(user).swapExactTokensForTokens(
          0n,
          1n,
          tokenAAddr,
          tokenBAddr,
          user.address,
          deadline
        )
      ).to.be.revertedWith("SonicAggregatorRouter: zero amount");
    });

    it("Reverts when output below minimum", async function () {
      const tokenAAddr = await mockTokenA.getAddress();
      const tokenBAddr = await mockTokenB.getAddress();
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      await expect(
        router.connect(user).swapExactTokensForTokens(
          ethers.parseEther("1"),
          ethers.parseEther("999999"), // impossibly high min
          tokenAAddr,
          tokenBAddr,
          user.address,
          deadline
        )
      ).to.be.revertedWith("SonicAggregatorRouter: insufficient output amount");
    });
  });

  // ──────────────────────────────────────────────────
  // Liquidity threshold
  // ──────────────────────────────────────────────────

  describe("Liquidity threshold", function () {
    it("Skips pools below the min liquidity threshold", async function () {
      // Deploy a low-liquidity pair (100 units each)
      const tokenAAddr = await mockTokenA.getAddress();
      const tokenBAddr = await mockTokenB.getAddress();
      const lowReserve = ethers.parseEther("100"); // below default 10k threshold
      const lowPair = await deployMockPair(tokenAAddr, tokenBAddr, lowReserve, lowReserve);
      const lowFactory = await deployMockFactory(tokenAAddr, tokenBAddr, await lowPair.getAddress());
      const lowDexRouter = await deployMockRouter(await lowFactory.getAddress(), await mockWS.getAddress());

      const SonicAggregatorRouter = await ethers.getContractFactory("SonicAggregatorRouter");
      const freshRouter = await SonicAggregatorRouter.deploy(await mockWS.getAddress(), owner.address);
      // Only add the low-liquidity DEX
      await freshRouter.addDex(await lowFactory.getAddress(), await lowDexRouter.getAddress(), "LowLiqDEX");

      await expect(
        freshRouter.getBestRoute(ethers.parseEther("1"), tokenAAddr, tokenBAddr)
      ).to.be.revertedWith("SonicAggregatorRouter: no valid route found");
    });
  });
});
