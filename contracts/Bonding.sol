//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "./interfaces/ISKU.sol";
import "./interfaces/IOracle.sol";
import "hardhat/console.sol";

contract Bonding is Ownable {
	using SafeMath for uint;
    ISKU public sku;
    ISKU public skusd;

    uint constant MAG = 1e18; 

    uint public base;
    bool public preMinted;
    address public oracle;
    address public feeTo;
    int public delta;

    using SafeERC20 for IERC20;
    event PreMint(address to, uint amount);
    event Bond(uint amountInSKU, uint amountOutUSD, uint feeSKU);
    event Unbond(uint amountInUSD, uint amountOutSKU, uint feeUSD);

    constructor(ISKU _sku, ISKU _skusd, address _oracle, address _feeTo) {
        sku = _sku;
        skusd = _skusd;
        oracle = _oracle;
        feeTo = _feeTo;
    }

    function preMint(address _to, uint _amount) external onlyOwner {
    	require(!preMinted, "ALREADY INIT");
    	preMinted = true;
    	sku.mint(_to, _amount);
    	skusd.mint(_to, _amount);
    	base = _amount;
    	emit PreMint(_to, _amount);
    }

    function bond(uint amountInSKU, uint amountOutUSDMin) external returns (uint amountOutUSD, uint fee) {
        uint priceUSD = IOracle(oracle).getPrice("SKUSD");
    	uint priceSKU = IOracle(oracle).getPrice("SKU");

    	//sku to fiat value
    	uint valueSKU = amountInSKU.mul(priceSKU).div(MAG);

        uint poolUSD = uint(int(base) + delta);
        uint poolSKU = base.mul(base).div(poolUSD);

        uint valueSwap = poolUSD.sub(base.mul(base).div(poolSKU.add(valueSKU)));
        if(valueSKU > valueSwap) {
        	//trans usd to sku
        	fee = amountInSKU.mul(valueSKU.sub(valueSwap)).div(valueSKU);
        	sku.mint(feeTo, fee);
        }

        amountOutUSD = valueSwap.mul(MAG).div(priceUSD);
        require(amountOutUSD >= amountOutUSDMin, "PRICE SLIP");
        delta = delta - int(amountOutUSD);

        sku.burn(msg.sender, amountInSKU);
        skusd.mint(msg.sender, amountOutUSD);
        emit Bond(amountInSKU, amountOutUSD, fee);
    }

    //100
    //999900 1000099.99000099990001

    function unbond(uint amountInUSD, uint amountOutSKUMin) external returns (uint amountOutSKU, uint fee) {
    	uint priceUSD = IOracle(oracle).getPrice("SKUSD");
    	uint priceSKU = IOracle(oracle).getPrice("SKU");
    	// uint rate = IOracle(oracle).getRate("SKU", "SKUSD");

    	//usd to fiat value
    	uint valueUSD = amountInUSD.mul(priceUSD).div(MAG);

        uint poolUSD = uint(int(base) + delta);
        uint poolSKU = base.mul(base).div(poolUSD);

        uint valueSwap = poolSKU.sub(base.mul(base).div(poolUSD.add(valueUSD)));
          console.log("Changing greeting from USD '%d' to SKU '%d' amount '%d'", poolUSD, poolSKU, valueSwap);
        if(valueUSD > valueSwap) {
        	//amount = feePercentage / amountSKUForPrice
        	fee = amountInUSD.mul(valueUSD.sub(valueSwap)).div(valueUSD);
        	skusd.mint(feeTo, fee);
        }

        amountOutSKU = valueSwap.mul(MAG).div(priceSKU);
        require(amountOutSKU >= amountOutSKUMin, "PRICE SLIP");
        delta = delta + int(valueSwap);

        ISKU(skusd).burn(msg.sender, amountInUSD);
        ISKU(sku).mint(msg.sender, amountOutSKU);
        emit Bond(amountInUSD, amountOutSKU, fee);
    }
}
