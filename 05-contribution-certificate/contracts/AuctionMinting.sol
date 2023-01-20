// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/*

tl;dr: bid for a chance to mint an NFT every 24 hours (like nouns)

1. bid by sending in value larger than current highest bid
2. after 24 hours of bidding, highest bidder gets NFT
3. someone settles the auction, which starts the next one

*/

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract DailyAuctionNFT is ERC721 {
    uint256 public highestBid;
    address public highestBidder;
    uint256 public tokenId = 1;
    uint256 public deadline;

    constructor() {
        deadline = block.timestamp + 1 days;
    }

    function bid() public payable {
        require(
            block.timestamp <= deadline,
            "Current auction period has expired, auction must be settled"
        );

        require(
            msg.value > highestBid,
            "Value is not higher than the current highest bid"
        );

        // return the highest bid amount to current highest bidder
        (bool success, ) = highestBidder.call{value: highestBid}("");

        highestBidder = msg.sender;
        highestBid = msg.value;
    }

    // settle will mint the next token to the highest bidder
    // it will reset the highest bidder + auction period and increment the token ID
    function settle() public {
        require(
            block.timestamp > deadline,
            "Current auction period is still active"
        );

        _mint(highestBidder, tokenId);
        tokenId++;

        highestBidder = address(0);
        deadline = block.timestamp + 1 days;
    }
}
