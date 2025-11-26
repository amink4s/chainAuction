# DailyCast Auction

A Farcaster mini-app featuring a unique daily auction.

## Features

- **Daily Auctions**: Unique artifacts available for auction daily.
- **Bidding System**: Simulate placing bids in ETH (mock implementation).
- **Smart Contract Analysis**: Analyze contracts for risk.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the app:
   ```bash
   npm run dev
   ```

## Deploy to Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

1. Push your code to a GitHub repository.
2. Import the project into Vercel.
3. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fyour-repo-name)

## Smart Contracts

This project uses two smart contracts to handle the auction process.

### 1. Minting your NFT (`SimpleNFT.sol`)
Before you can auction an item, it must exist as an NFT on the blockchain.
1.  Deploy `SimpleNFT.sol`.
2.  Upload your image and metadata (JSON) to Pinata (or any IPFS provider).
3.  Call `mintNFT(your_address, "your_pinata_metadata_url")`.

### 2. Creating an Auction (`contract.sol`)
Once you own the NFT:
1.  Deploy `FarcasterNativeAuction` (`contract.sol`).
2.  **Approve** the Auction contract to transfer your NFT:
    - Call `approve(auction_contract_address, token_id)` on the `SimpleNFT` contract.
3.  **Create** the auction:
    - Call `createAuction(nft_contract_address, token_id, reserve_price, duration)` on the Auction contract.

