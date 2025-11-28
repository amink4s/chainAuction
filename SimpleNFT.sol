// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SimpleNFT
 * @notice A simple ERC721 contract to mint NFTs with metadata URIs (e.g., from Pinata).
 */
contract SimpleNFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIds;

    constructor() ERC721("DailyCastNFT", "DCN") Ownable(msg.sender) {}

    /**
     * @notice Mints a new NFT to the specified recipient.
     * @param recipient The address to receive the NFT.
     * @param tokenURI The metadata URI (e.g., ipfs://... or https://gateway.pinata.cloud/...)
     * @return The ID of the newly minted token.
     */
    function mintNFT(address recipient, string memory tokenURI)
        public
        onlyOwner
        returns (uint256)
    {
        _tokenIds++;
        uint256 newItemId = _tokenIds;

        _mint(recipient, newItemId);
        _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }
}