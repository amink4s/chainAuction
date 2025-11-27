// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./contract.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract USDWrapper {
    FarcasterNativeAuction public auctionContract;
    AggregatorV3Interface internal priceFeed;

    event BidPlaced(address indexed bidder, uint256 amountUsd, uint256 amountEth);

    constructor(address _auctionContract, address _priceFeed) {
        auctionContract = FarcasterNativeAuction(_auctionContract);
        priceFeed = AggregatorV3Interface(_priceFeed);
    }

    function placeBid(uint256 _auctionId, uint256 _amountUsd) external payable {
        // Get ETH price in USD (8 decimals)
        (, int256 price, , , ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price feed");

        // Calculate required ETH
        // 1 ETH = price * 10^-8 USD
        // 1 USD = 10^8 / price ETH
        // amountEth = amountUsd * 10^18 * 10^8 / price (if amountUsd is integer)
        
        uint256 amountEth = (_amountUsd * 1e26) / uint256(price);
        
        require(msg.value >= amountEth, "Insufficient ETH sent");

        // Refund excess
        if (msg.value > amountEth) {
            payable(msg.sender).transfer(msg.value - amountEth);
        }

        // Forward to auction contract
        auctionContract.placeBidFor{value: amountEth}(_auctionId, msg.sender);
        
        emit BidPlaced(msg.sender, _amountUsd, amountEth);
    }
}
