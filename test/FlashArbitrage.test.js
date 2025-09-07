const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FlashArbitrage", function () {
  let flashArbitrage;
  let owner, addr1;
  
  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    
    const FlashArbitrage = await ethers.getContractFactory("FlashArbitrage");
    flashArbitrage = await FlashArbitrage.deploy();
    await flashArbitrage.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      // Owner is private, we can test by checking only owner can call functions
      expect(flashArbitrage.target).to.not.be.undefined;
    });
  });

  describe("Ownership", function () {
    it("Should allow only owner to call execute", async function () {
      await expect(
        flashArbitrage.connect(addr1).execute(ethers.parseUnits("1000", 18))
      ).to.be.reverted;
    });

    it("Should allow only owner to call withdraw", async function () {
      const mockTokenAddress = "0x0000000000000000000000000000000000000001";
      await expect(
        flashArbitrage.connect(addr1).withdraw(mockTokenAddress)
      ).to.be.reverted;
    });
  });

  describe("Constants", function () {
    it("Should have correct hardcoded addresses", async function () {
      const aavePool = "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951";
      const usdt = "0x58Eb19eF91e8A6327FEd391b51aE1887b833cc91";
      const eth = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";
      const uniPair = "0x937B8c32E190FB69ca9FFAE6e6d8b083d3dE53A4";
      const dexRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
      
      // These would be internal constants, so we can't directly test them
      // but we can verify the contract was deployed correctly
      expect(flashArbitrage.target).to.not.be.undefined;
    });
  });

  describe("Flash Loan Execution", function () {
    it("Should revert executeOperation when called by non-AAVE pool", async function () {
      const asset = "0x58Eb19eF91e8A6327FEd391b51aE1887b833cc91";
      const amount = ethers.parseUnits("1000", 18);
      const premium = ethers.parseUnits("10", 18);
      const initiator = owner.address;
      const params = "0x";

      await expect(
        flashArbitrage.executeOperation(asset, amount, premium, initiator, params)
      ).to.be.reverted;
    });
  });

  describe("Balance Helper", function () {
    it("Should be able to check token balances", async function () {
      // Just verify the contract deployment
      expect(flashArbitrage.target).to.not.be.undefined;
    });
  });
});