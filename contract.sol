// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title FarcasterNativeAuction
 * @notice A standalone, on-chain reserve auction contract optimized for Farcaster Mini Apps.
 * @dev Implements "Reserve Auction" logic: Auction starts only when the first bid >= reserve price is made.
 * Includes "Anti-Sniping" extensions and "Pull Payment" patterns for security.
 */
contract FarcasterNativeAuction is ReentrancyGuard, Ownable, Pausable {
    
    // --- Events ---
    event AuctionCreated(
        uint256 indexed auctionId, 
        address indexed nftContract, 
        uint256 indexed tokenId, 
        address seller, 
        uint256 reservePrice, 
        uint256 duration
    );
    event AuctionStarted(uint256 indexed auctionId, address indexed bidder, uint256 endTime);
    event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount, uint256 endTime);
    event AuctionEnded(uint256 indexed auctionId, address winner, uint256 amount);
    event AuctionCanceled(uint256 indexed auctionId);
    event Withdrawal(address indexed user, uint256 amount);

    // --- Structs ---
    struct Auction {
        uint256 id;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        uint256 reservePrice;
        uint256 duration;       // Duration in seconds (e.g., 24 hours)
        uint256 startTime;      // 0 if not started
        uint256 endTime;        // 0 if not started
        address payable highestBidder;
        uint256 highestBid;
        bool ended;
    }

    // --- State Variables ---
    uint256 private _auctionIdCounter;
    uint256 public minBidIncrementPercentage = 5; // 5% minimum bid increase
    uint256 public timeBuffer = 15 minutes;       // Anti-sniping buffer

    // Mapping from auction ID to Auction struct
    mapping(uint256 => Auction) public auctions;

    // Pull-Payment Pattern: Stores funds users can withdraw (outbid funds)
    mapping(address => uint256) public pendingReturns;

    // --- Modifiers ---
    modifier onlySeller(uint256 auctionId) {
        require(msg.sender == auctions[auctionId].seller, "Not the seller");
        _;
    }

    modifier auctionExists(uint256 auctionId) {
        require(auctions[auctionId].seller != address(0), "Auction does not exist");
        _;
    }

    constructor() Ownable(msg.sender) {}

    // --- Core Logic ---

    /**
     * @notice Creates an auction. The NFT is transferred into escrow.
     * @param _nftContract Address of the ERC721 contract
     * @param _tokenId Token ID of the NFT
     * @param _reservePrice Minimum price to start the auction (in wei)
     * @param _duration Duration of the auction once the first bid is placed
     */
    function createAuction(
        address _nftContract,
        uint256 _tokenId,
        uint256 _reservePrice,
        uint256 _duration
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(_duration >= 5 minutes, "Duration too short");
        require(_reservePrice > 0, "Reserve price must be > 0");

        // Transfer NFT to this contract (Escrow)
        IERC721(_nftContract).transferFrom(msg.sender, address(this), _tokenId);

        _auctionIdCounter++;
        uint256 newAuctionId = _auctionIdCounter;

        auctions[newAuctionId] = Auction({
            id: newAuctionId,
            nftContract: _nftContract,
            tokenId: _tokenId,
            seller: payable(msg.sender),
            reservePrice: _reservePrice,
            duration: _duration,
            startTime: 0,
            endTime: 0,
            highestBidder: payable(address(0)),
            highestBid: 0,
            ended: false
        });

        emit AuctionCreated(newAuctionId, _nftContract, _tokenId, msg.sender, _reservePrice, _duration);
        return newAuctionId;
    }

    /**
     * @notice Place a bid on an auction.
     * @dev First bid >= reserve price triggers the timer. Subsequent bids must be X% higher.
     * @param _auctionId The ID of the auction
     */
    function placeBid(uint256 _auctionId) external payable nonReentrant auctionExists(_auctionId) whenNotPaused {
        Auction storage auction = auctions[_auctionId];

        require(!auction.ended, "Auction ended");
        require(msg.sender != auction.seller, "Seller cannot bid");

        // Case 1: First Bid
        if (auction.highestBid == 0) {
            require(msg.value >= auction.reservePrice, "Bid must meet reserve price");
            
            // Start the timer
            auction.startTime = block.timestamp;
            auction.endTime = block.timestamp + auction.duration;
            
            auction.highestBidder = payable(msg.sender);
            auction.highestBid = msg.value;

            emit AuctionStarted(_auctionId, msg.sender, auction.endTime);
            emit BidPlaced(_auctionId, msg.sender, msg.value, auction.endTime);
        } 
        // Case 2: Subsequent Bids
        else {
            require(block.timestamp < auction.endTime, "Auction expired");
            
            // Calculate minimum required bid
            uint256 minBid = auction.highestBid + ((auction.highestBid * minBidIncrementPercentage) / 100);
            require(msg.value >= minBid, "Bid too low");

            // Refund the previous bidder
            // IMPORTANT: We use Pull Payment pattern here to prevent DOS attacks
            // If we sent ETH directly and it failed, the auction would be stuck.
            pendingReturns[auction.highestBidder] += auction.highestBid;

            // Update state
            auction.highestBidder = payable(msg.sender);
            auction.highestBid = msg.value;

            // Anti-Sniping: Extend auction if bid placed in last X minutes
            if (auction.endTime - block.timestamp < timeBuffer) {
                auction.endTime = block.timestamp + timeBuffer;
            }

            emit BidPlaced(_auctionId, msg.sender, msg.value, auction.endTime);
        }
    }

    /**
     * @notice End the auction and transfer assets.
     * @dev Can be called by anyone (usually the winner or seller) after expiration.
     */
    function endAuction(uint256 _auctionId) external nonReentrant auctionExists(_auctionId) {
        Auction storage auction = auctions[_auctionId];

        require(!auction.ended, "Already ended");
        
        // If auction started, check expiry
        if (auction.startTime != 0) {
            require(block.timestamp >= auction.endTime, "Auction not yet expired");
        } else {
            // If auction never started, seller can cancel/end it essentially
            require(msg.sender == auction.seller, "Only seller can cancel unstarted auction");
        }

        auction.ended = true;

        if (auction.highestBid > 0) {
            // Transfer NFT to winner
            IERC721(auction.nftContract).transferFrom(address(this), auction.highestBidder, auction.tokenId);
            
            // Transfer ETH to seller
            // In production, consider sending a fee to the platform/MiniApp owner here
            (bool success, ) = auction.seller.call{value: auction.highestBid}("");
            require(success, "ETH transfer to seller failed");
            
            emit AuctionEnded(_auctionId, auction.highestBidder, auction.highestBid);
        } else {
            // No bids were placed, return NFT to seller
            IERC721(auction.nftContract).transferFrom(address(this), auction.seller, auction.tokenId);
            emit AuctionEnded(_auctionId, address(0), 0);
        }
    }

    /**
     * @notice Cancel an auction if it hasn't started yet.
     */
    function cancelAuction(uint256 _auctionId) external nonReentrant onlySeller(_auctionId) {
        Auction storage auction = auctions[_auctionId];
        require(auction.startTime == 0, "Auction already started");
        require(!auction.ended, "Auction already ended");

        auction.ended = true;
        IERC721(auction.nftContract).transferFrom(address(this), auction.seller, auction.tokenId);
        
        emit AuctionCanceled(_auctionId);
    }

    /**
     * @notice Withdraw outbid funds.
     */
    function withdraw() external nonReentrant {
        uint256 amount = pendingReturns[msg.sender];
        require(amount > 0, "No funds to withdraw");

        pendingReturns[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Withdraw failed");

        emit Withdrawal(msg.sender, amount);
    }

    // --- Admin Functions ---

    function setMinBidIncrement(uint256 _percentage) external onlyOwner {
        minBidIncrementPercentage = _percentage;
    }

    function setTimeBuffer(uint256 _seconds) external onlyOwner {
        timeBuffer = _seconds;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }

    // --- View Functions for Frontend/Frame ---

    /**
     * @notice Returns key details for a Mini App to display.
     */
    function getAuctionDetails(uint256 _auctionId) external view returns (
        address seller,
        uint256 highestBid,
        address highestBidder,
        uint256 endTime,
        bool ended,
        bool started
    ) {
        Auction storage auction = auctions[_auctionId];
        return (
            auction.seller,
            auction.highestBid,
            auction.highestBidder,
            auction.endTime,
            auction.ended,
            auction.startTime > 0
        );
    }
}