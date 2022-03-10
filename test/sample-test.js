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
        // await 
        // await depositToBank();

        // for(let i = 0;i < 20;i++) {
        //     console.log(1)
        //     await bonding.connect(user1).bond(toTokenAmount(100), 0);
        //     await logBalance(user1);
        //     await logBalance(feeTo);
        // }
        

        // await (await oracle.setPrice(["SKU"], [toTokenAmount(0.1)]));

        // let result = await bonding.connect(user1).callStatic.unbond(toTokenAmount(100), 0);

        // console.log(`result: ${toMathAmount(result[0])} ${toMathAmount(result[1])}`)
        console.log(2);
        await bonding.connect(user1).unbond(toTokenAmount(100), 0);
        await logBalance(user1);
        await logBalance(feeTo);


        console.log(3);
        await bonding.connect(user1).bond(toTokenAmount(100), 0);
        await logBalance(user1);
        await logBalance(feeTo);

        console.log(3);
        await bonding.connect(user1).unbond(toTokenAmount(100), 0);
        await logBalance(user1);
        await logBalance(feeTo);
   });
});
