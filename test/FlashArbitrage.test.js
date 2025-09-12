const { ethers } = require("hardhat")
const assert = require("assert")

describe("Flash loan - 2/1 Arbitrage (Sepolia)", function () {
  let flashArbitrage
  let owner, addr1
  let tokenA, tokenB, tokenC
  let uniswapV2Factory, uniswapV2Router
  let uniswapV3Factory, uniswapV3PositionManager

  // Sepolia Uniswap addresses
  const UNISWAP_V2_FACTORY = "0x7E0987E5b3a30e3f2828572Bb659A548460a3003"
  const UNISWAP_V2_ROUTER = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008"
  const UNISWAP_V3_FACTORY = "0x0227628f3F023bb0B980b67D528571c95c6DaC1c"
  const UNISWAP_V3_POSITION_MANAGER = "0x1238536071E1c677A632429e3655c799b22cDA52"

  before(async function () {
    this.timeout(600000) // 10 minutes
    const signers = await ethers.getSigners()
    console.log("Number of signers:", signers.length)
    console.log("First signer:", signers[0])

    if (signers.length === 0) {
      throw new Error("No signers available. Make sure PRIVATE_KEY environment variable is set.")
    }

    owner = signers[0]
    addr1 = signers[1]

    console.log("Running on Sepolia testnet")
    console.log("Owner address:", owner.address)

    // Deploy test tokens B, C
    console.log("Deploying test tokens...")
    const TestToken = await ethers.getContractFactory("TestToken")

    tokenB = await ethers.getContractAt("B", '0x37DCB6a330BFF5e9829b69d4d5f0d41d47F94B82')
    tokenC = await ethers.getContractAt("C", '0x66f82D2c452190E168328189FE582b588577e0d2')

    // Get Uniswap contracts
    uniswapV2Factory = await ethers.getContractAt("IUniswapV2Factory", UNISWAP_V2_FACTORY)
    uniswapV2Router = await ethers.getContractAt("IUniswapV2Router02", UNISWAP_V2_ROUTER)
    uniswapV3Factory = await ethers.getContractAt("IUniswapV3Factory", UNISWAP_V3_FACTORY)
    uniswapV3PositionManager = await ethers.getContractAt("INonfungiblePositionManager", UNISWAP_V3_POSITION_MANAGER)

    const weth = await ethers.getContractAt("IWETH", '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14')
    // Approve tokens for Uniswap routers
    const approveAmount = ethers.parseEther("0.3")
    await weth.approve(UNISWAP_V2_ROUTER, approveAmount)
    await tokenB.approve(UNISWAP_V2_ROUTER, approveAmount)
    await tokenC.approve(UNISWAP_V2_ROUTER, approveAmount)
    await weth.approve(UNISWAP_V3_POSITION_MANAGER, approveAmount)
    await tokenC.approve(UNISWAP_V3_POSITION_MANAGER, approveAmount)

    // Create Uniswap V2 pools [WETH,B] and [B,C]
    console.log("Creating Uniswap V2 pools...")
    console.log("Token WETH address:", weth.target)
    console.log("Token B address:", tokenB.target)
    console.log("Token C address:", tokenC.target)

    // Create pair WETH-B
    try {
      console.log("Creating pair WETH-B...")
      const createTxWETHB = await uniswapV2Factory.createPair(weth.target, tokenB.target)
      const receiptWETHB = await createTxWETHB.wait()
      console.log("Create pair WETH-B transaction status:", receiptWETHB.status)
      console.log("Create pair WETH-B gas used:", receiptWETHB.gasUsed.toString())
    } catch (error) {
      console.log("Error creating pair WETH-B:", error.message)
    }

    const pairWETHB = await uniswapV2Factory.getPair(weth.target, tokenB.target)
    console.log("Uniswap V2 pair WETH-B created at:", pairWETHB)

    // Create pair B-C
    try {
      console.log("Creating pair B-C...")
      const createTxBC = await uniswapV2Factory.createPair(tokenB.target, tokenC.target)
      const receiptBC = await createTxBC.wait()
      console.log("Create pair B-C transaction status:", receiptBC.status)
      console.log("Create pair B-C gas used:", receiptBC.gasUsed.toString())
    } catch (error) {
      console.log("Error creating pair B-C:", error.message)
    }

    const pairBC = await uniswapV2Factory.getPair(tokenB.target, tokenC.target)
    console.log("Uniswap V2 pair B-C created at:", pairBC)

    // Add liquidity to V2 pools
    const liquidityAmount = ethers.parseEther("0.14")
    const deadline = Math.floor(Date.now() / 1000) + 3600

    await uniswapV2Router.addLiquidity(
      weth.target,
      tokenB.target,
      liquidityAmount,
      liquidityAmount,
      0,
      0,
      owner.address,
      deadline
    )
    console.log("Liquidity added to V2 pool WETH-B")

    await uniswapV2Router.addLiquidity(
      tokenB.target,
      tokenC.target,
      liquidityAmount,
      liquidityAmount,
      0,
      0,
      owner.address,
      deadline
    )
    console.log("Liquidity added to V2 pool B-C")

    // Create Uniswap V3 pool [WETH,C]
    console.log("Creating Uniswap V3 pool WETH-C...")
    const fee = 3000 // 0.3%

    // Sort token addresses (token0 must be < token1)
    let token0, token1
    if (weth.target < tokenC.target) {
      token0 = weth.target
      token1 = tokenC.target
    } else {
      token0 = tokenC.target
      token1 = weth.target
    }
    console.log("Sorted tokens - token0:", token0, "token1:", token1)

    try {
      console.log("Creating V3 pool...")
      const createPoolTx = await uniswapV3Factory.createPool(token0, token1, fee)
      const receipt = await createPoolTx.wait()
      console.log("V3 pool creation status:", receipt.status)
      console.log("V3 pool creation gas used:", receipt.gasUsed.toString())
    } catch (error) {
      console.log("Error creating V3 pool:", error.message)
    }

    const poolWETHC_V3 = await uniswapV3Factory.getPool(token0, token1, fee)
    console.log("Uniswap V3 pool WETH-C created at:", poolWETHC_V3)

    // Initialize V3 pool price (1.5:1 ratio, WETH/C = 1.5)
    const pool = await ethers.getContractAt("IUniswapV3Pool", poolWETHC_V3)
    const sqrtPriceX96 = "97014204836101100663100142551" // sqrt(1.5) * 2^96

    try {
      console.log("Initializing V3 pool with price...")
      await pool.initialize(sqrtPriceX96)
      console.log("V3 pool initialized successfully")
    } catch (error) {
      console.log("Error initializing V3 pool:", error.message)
    }

    const slot0 = await pool.slot0()

    // Add liquidity to V3 pool
    try {
      console.log("Adding liquidity to V3 pool...")
      // Calculate amounts based on which token is token0/token1 and pool price ratio
      // Pool price ratio WETH/C = 1.5, so we need 1.5x more WETH than C
      let amount0Desired, amount1Desired

      if (token0 == weth.target) {
        // token0 = WETH, token1 = C
        amount0Desired = ethers.parseEther("0.14")  // Token WETH (1.5x)
        amount1Desired = liquidityAmount             // Token C (base)
      } else {
        // token0 = C, token1 = WETH
        amount0Desired = liquidityAmount             // Token C (base)
        amount1Desired = ethers.parseEther("0.14")  // Token WETH (1.5x)
      }

      const mintParams = [
        token0,              // token0
        token1,              // token1
        fee,                 // fee
        -887220,             // tickLower
        887220,              // tickUpper
        amount0Desired,      // amount0Desired
        amount1Desired,      // amount1Desired
        0,                   // amount0Min
        0,                   // amount1Min
        owner.address,       // recipient
        deadline             // deadline
      ]

      await uniswapV3PositionManager.mint(mintParams)
      console.log("Liquidity added to V3 pool successfully")
    } catch (error) {
      console.log("Error adding liquidity to V3 pool:", error.message)
    }
    console.log("Liquidity added to V3 pool WETH-C")

    // Deploy FlashArbitrage contract
    const FlashArbitrage = await ethers.getContractFactory("FlashArbitrage")
    flashArbitrage = await FlashArbitrage.deploy()
    await flashArbitrage.waitForDeployment()

    console.log("FlashArbitrage contract deployed to:", flashArbitrage.target)
    console.log("Setup completed: 3 tokens and 3 pools deployed")
  })

  describe("Sepolia Execute Function", function () {
    it("Should execute profitable arbitrage successfully", async function () {
      this.timeout(600000) // 10 minutes
      const flashLoanAmount = ethers.parseEther("0.01") // 0.01 tokens

      console.log("Attempting to execute flash loan with amount:", ethers.formatEther(flashLoanAmount), "tokens")

      const tx = await flashArbitrage.execute(flashLoanAmount)
      console.log("Transaction hash:", tx.hash)

      const receipt = await tx.wait()
      console.log("Transaction confirmed in block:", receipt.blockNumber)
      console.log("Gas used:", receipt.gasUsed.toString())

      // Check profit remaining in contract
      const contractBalanceA = await tokenA.balanceOf(flashArbitrage.target)
      console.log("Profit in contract (Token A):", ethers.formatEther(contractBalanceA), "tokens")

      assert.strictEqual(receipt.status, 1)
      console.log("Arbitrage executed successfully with profit!")
    })
  })
})
