const { expect } = require("chai");
const { ethers } = require("hardhat");
let BN = require("bignumber.js");

function toTokenAmount(amount, decimals = 18) {
    return new BN(amount).multipliedBy(new BN("10").pow(decimals)).toFixed()
}

const toMathAmount = (amount, decimals = 18) => new BN(amount.toString()).dividedBy(new BN(Math.pow(10, decimals))).toFixed();

describe("Bond", function () {
  let sku, skusd, bonding, oracle;
  let developer, user1, feeTo;

  before(async () => {
      [developer, user1, feeTo] = await ethers.getSigners()

      let SKU = await ethers.getContractFactory("SKU");
      sku = await SKU.deploy("SKU", "SKU");
      skusd = await SKU.deploy("SKUSD", "SKUSD");

      let Oracle = await ethers.getContractFactory("Oracle");
      oracle = await Oracle.deploy();

      let Bonding = await ethers.getContractFactory("Bonding");
      bonding = await Bonding.deploy(sku.address, skusd.address, oracle.address, feeTo.address);

      await (await sku.addPermission(bonding.address)).wait();
      await (await skusd.addPermission(bonding.address)).wait();

      await (await bonding.preMint(user1.address, toTokenAmount(1000000))).wait();
      await logBalance(user1);

      await (await oracle.setPrice(["SKU", "SKUSD"], [toTokenAmount(0.5), toTokenAmount(1)]));
  });

  async function logBalance(wallet) {
      let skuBalance = await sku.balanceOf(wallet.address);
      let usdBalance = await skusd.balanceOf(wallet.address);

      // console.log(`delta ${await bonding.delta()}`);
      console.log(`sku: ${toMathAmount(skuBalance)} usd: ${toMathAmount(usdBalance)}`);
  }

  it("simple bond", async function () {
        await bonding.connect(user1).unbond(toTokenAmount(100), 0);
        await logBalance(user1);
        await logBalance(feeTo);

        await bonding.connect(user1).bond(toTokenAmount(100), 0);
        await logBalance(user1);
        await logBalance(feeTo);
   });
});
