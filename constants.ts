import { Bid } from './types';

export const MOCK_INITIAL_BIDS: Bid[] = [
  {
    id: '1',
    bidder: 'vitalik.eth',
    amount: 1.2,
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    hash: '0x7f...3a2b'
  },
  {
    id: '2',
    bidder: 'dwr.eth',
    amount: 0.8,
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    hash: '0x9c...1e4f'
  }
];

export const MOCK_SMART_CONTRACT = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DailyAuction
 * @dev A daily auction contract for Gemini-generated artifacts
 */
contract DailyAuction is ERC721, Ownable, ReentrancyGuard {
    uint256 public currentAuctionId;
    uint256 public auctionEndTime;
    uint256 public highestBid;
    address public highestBidder;
    bool public ended;

    event NewBid(address indexed bidder, uint256 amount);
    event AuctionEnded(address winner, uint256 amount);

    constructor() ERC721("DailyCastArtifact", "DCA") Ownable(msg.sender) {}

    function startAuction(uint256 _duration, uint256 _startingPrice) external onlyOwner {
        require(block.timestamp > auctionEndTime, "Current auction active");
        currentAuctionId++;
        auctionEndTime = block.timestamp + _duration;
        highestBid = _startingPrice;
        highestBidder = address(0);
        ended = false;
    }

    function bid() external payable nonReentrant {
        require(block.timestamp < auctionEndTime, "Auction ended");
        require(msg.value > highestBid, "Bid too low");

        if (highestBidder != address(0)) {
            // Refund previous bidder
            payable(highestBidder).transfer(highestBid);
        }

        highestBid = msg.value;
        highestBidder = msg.sender;
        emit NewBid(msg.sender, msg.value);
    }
    
    // ... Additional logic for settlement
}`;