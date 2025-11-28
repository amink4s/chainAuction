// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// --- CHANGE 1: Import the SafeERC20 helper ---
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title FarcasterNativeAuctionUSDC (V2)
 * @notice A standalone, on-chain reserve auction contract that uses USDC.
 * @dev V2 incorporates SafeERC20 and updates the endAuction transfer order.
 */
contract FarcasterNativeAuctionUSDC is ReentrancyGuard, Ownable, Pausable {
    
    // --- CHANGE 2: Tell the contract to use SafeERC20 for all IERC20 tokens ---
    using SafeERC20 for IERC20;

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
        address seller;
        uint256 reservePrice;
        uint256 duration;
        uint256 startTime;
        uint256 endTime;
        address highestBidder;
        uint256 highestBid;
        bool ended;
    }

    // --- State Variables ---
    IERC20 public usdcToken;
    uint256 private _auctionIdCounter;
    uint256 public minBidIncrementPercentage = 5;
    uint256 public timeBuffer = 15 minutes;

    mapping(uint256 => Auction) public auctions;
    mapping(address => uint26) public pendingReturns;

    // --- Constructor ---
    constructor(address _usdcTokenAddress) Ownable(msg.sender) {
        usdcToken = IERC20(_usdcTokenAddress);
    }

    // --- Modifiers ---
    modifier onlySeller(uint256 auctionId) {
        require(msg.sender == auctions[auctionId].seller, "Not the seller");
        _;
    }

    modifier auctionExists(uint256 auctionId) {
        require(auctions[auctionId].seller != address(0), "Auction does not exist");
        _;
    }

    // --- Core Logic ---

    function createAuction(
        address _nftContract,
        uint256 _tokenId,
        uint256 _reservePrice,
        uint256 _duration
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(_duration >= 5 minutes, "Duration too short");
        require(_reservePrice > 0, "Reserve price must be > 0");

        IERC721(_nftContract).transferFrom(msg.sender, address(this), _tokenId);

        _auctionIdCounter++;
        uint256 newAuctionId = _auctionIdCounter;

        auctions[newAuctionId] = Auction({
            id: newAuctionId,
            nftContract: _nftContract,
            tokenId: _tokenId,
            seller: msg.sender,
            reservePrice: _reservePrice,
            duration: _duration,
            startTime: 0,
            endTime: 0,
            highestBidder: address(0),
            highestBid: 0,
            ended: false
        });

        emit AuctionCreated(newAuctionId, _nftContract, _tokenId, msg.sender, _reservePrice, _duration);
        return newAuctionId;
    }

    function placeBid(uint256 _auctionId, uint256 _bidAmount) external nonReentrant auctionExists(_auctionId) whenNotPaused {
        Auction storage auction = auctions[_auctionId];

        require(!auction.ended, "Auction ended");
        require(msg.sender != auction.seller, "Seller cannot bid");

        if (auction.highestBid == 0) {
            require(_bidAmount >= auction.reservePrice, "Bid must meet reserve price");
            
            auction.startTime = block.timestamp;
            auction.endTime = block.timestamp + auction.duration;
            auction.highestBidder = msg.sender;
            auction.highestBid = _bidAmount;
            
            // --- CHANGE 3: Use safeTransferFrom ---
            usdcToken.safeTransferFrom(msg.sender, address(this), _bidAmount);

            emit AuctionStarted(_auctionId, msg.sender, auction.endTime);
            emit BidPlaced(_auctionId, msg.sender, _bidAmount, auction.endTime);
        } 
        else {
            require(block.timestamp < auction.endTime, "Auction expired");
            
            uint256 minBid = auction.highestBid + ((auction.highestBid * minBidIncrementPercentage) / 100);
            require(_bidAmount >= minBid, "Bid too low");

            // --- CHANGE 4: Use safeTransferFrom ---
            usdcToken.safeTransferFrom(msg.sender, address(this), _bidAmount);

            pendingReturns[auction.highestBidder] += auction.highestBid;

            auction.highestBidder = msg.sender;
            auction.highestBid = _bidAmount;

            if (auction.endTime - block.timestamp < timeBuffer) {
                auction.endTime = block.timestamp + timeBuffer;
            }

            emit BidPlaced(_auctionId, msg.sender, _bidAmount, auction.endTime);
        }
    }

    function endAuction(uint256 _auctionId) external nonReentrant auctionExists(_auctionId) {
        Auction storage auction = auctions[_auctionId];
        require(!auction.ended, "Already ended");
        
        if (auction.startTime != 0) {
            require(block.timestamp >= auction.endTime, "Auction not yet expired");
        } else {
            require(msg.sender == auction.seller, "Only seller can cancel unstarted auction");
        }

        auction.ended = true;

        if (auction.highestBid > 0) {
            // --- CHANGE 5: Swapped the order of these two lines ---
            
            // 1. Send USDC to seller (using safeTransfer)
            usdcToken.safeTransfer(auction.seller, auction.highestBid);

            // 2. Send NFT to winner
            IERC721(auction.nftContract).transferFrom(address(this), auction.highestBidder, auction.tokenId);
            
            emit AuctionEnded(_auctionId, auction.highestBidder, auction.highestBid);
        } else {
            IERC721(auction.nftContract).transferFrom(address(this), auction.seller, auction.tokenId);
            emit AuctionEnded(_auctionId, address(0), 0);
        }
    }

    function cancelAuction(uint256 _auctionId) external nonReentrant onlySeller(_auctionId) {
        Auction storage auction = auctions[_auctionId];
        require(auction.startTime == 0, "Auction already started");
        require(!auction.ended, "Auction already ended");

        auction.ended = true;
        IERC721(auction.nftContract).transferFrom(address(this), auction.seller, auction.tokenId);
        
        emit AuctionCanceled(_auctionId);
    }

    function withdraw() external nonReentrant {
        uint256 amount = pendingReturns[msg.sender];
        require(amount > 0, "No funds to withdraw");

        pendingReturns[msg.sender] = 0;

        // --- CHANGE 6: Use safeTransfer for refunds ---
        usdcToken.safeTransfer(msg.sender, amount);

        emit Withdrawal(msg.sender, amount);
    }

    // --- Admin Functions ---
    function setMinBidIncrement(uint256 _percentage) external onlyOwner { minBidIncrementPercentage = _percentage; }
    function setTimeBuffer(uint256 _seconds) external onlyOwner { timeBuffer = _seconds; }
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // --- View Functions ---
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