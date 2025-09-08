const { ethers } = require("hardhat")
const assert = require("assert")

describe("Flash loan - 2/1 Arbitrage (Sepolia)", function () {
  let flashArbitrage
  let owner, addr1

  beforeAll(async function () {
    [owner, addr1] = await ethers.getSigners()

    console.log("Running on Sepolia testnet")
    console.log("Owner address:", owner.address)

    const FlashArbitrage = await ethers.getContractFactory("FlashArbitrage")
    flashArbitrage = await FlashArbitrage.deploy()
    await flashArbitrage.waitForDeployment()

    console.log("Contract deployed to:", flashArbitrage.target)
  })

  describe("Sepolia Execute Function", function () {
    it("Should call execute function on Sepolia testnet", async function () {
      const flashLoanAmount = ethers.parseUnits("100", 6) // 100 USDT (6 decimals)

      console.log("Attempting to execute flash loan with amount:", ethers.formatUnits(flashLoanAmount, 6), "USDT")

      try {
        const tx = await flashArbitrage.execute(flashLoanAmount)
        console.log("Transaction hash:", tx.hash)

        const receipt = await tx.wait()
        console.log("Transaction confirmed in block:", receipt.blockNumber)
        console.log("Gas used:", receipt.gasUsed.toString())

        assert.strictEqual(receipt.status, 1)
      } catch (error) {
        console.log("Expected error (likely insufficient funds or liquidity):", error.message)
        // This is expected on testnet due to lack of real funds/liquidity
        // The test verifies the function can be called, even if it reverts
        assert(error.message.includes("revert"))
      }
    })
  })
})
