// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

const walletList = ["0xA768267D5b04f0454272664F4166F68CFc447346", "0xfdA074b94B1e6Db7D4BEB45058EC99b262e813A5",
 "0xc03C12101AE20B8e763526d6841Ece893248a069", "0x3c5bae74ecaba2490e23c2c4b65169457c897aa0", "0x3897A13FbC160036ba614c07D703E1fCbC422599"]
let owner = "0x9F93bF49F2239F414cbAd0e4375c1e0E7AB833a2";
function toTokenAmount(amount, decimals = 18) {
    return new BN(amount).multipliedBy(new BN("10").pow(decimals)).toFixed()
}

const toMathAmount = (amount, decimals = 18) => new BN(amount.toString()).dividedBy(new BN(Math.pow(10, decimals))).toFixed();
let BN = require("bignumber.js");

let sku, skusd, bonding, oracle;
  let developer, user1, feeTo;

async function main() {
  console.log("deploy sku skusd");
  let SKU = await ethers.getContractFactory("SKU");
  sku = await SKU.deploy("SKU", "SKU");
  skusd = await SKU.deploy("SKUSD", "SKUSD");

  console.log("deploy oracle")
  let Oracle = await ethers.getContractFactory("Oracle");
  oracle = await Oracle.deploy();

  console.log("deploy bonding");
  let Bonding = await ethers.getContractFactory("Bonding");
      bonding = await Bonding.deploy(sku.address, skusd.address, oracle.address, owner);

  console.log("init")
      await (await sku.addPermission(bonding.address)).wait();
      await (await skusd.addPermission(bonding.address)).wait();

      await (await bonding.preMint(owner, toTokenAmount(1000000))).wait();
      await (await oracle.setPrice(["SKU", "SKUSD"], [toTokenAmount(0.5), toTokenAmount(1)]));


   console.log(`sku:${sku.address}\nskusd:${skusd.address}\noracle:${oracle.address}\nbonding:${bonding.address}`)
   await transfer();
   console.log("complete");
}

async function transfer() {
  for(let wallet of walletList) {
      await sku.transfer(wallet, toTokenAmount("10000"));
      await skusd.transfer(wallet, toTokenAmount("10000"));
      console.log("transfer", wallet);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
