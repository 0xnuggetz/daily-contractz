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
    address public fallbackAddress;
    uint256 public tokenId = 1;
    uint256 public deadline;

    event Mint(uint256 indexed tokenId, address indexed recipient);
    event Refund(uint256 indexed highestBid, address indexed highestBidder);

    error BidRefundFailed();

    constructor(address _fallbackAddress) ERC721("Daily Auction", "DAILY") {
        deadline = block.timestamp + 1 days;
        fallbackAddress = _fallbackAddress;
        highestBidder = _fallbackAddress;
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

        if (success) {
            emit Refund(highestBid, highestBidder);
            highestBidder = msg.sender;
            highestBid = msg.value;
        } else {
            revert BidRefundFailed();
        }
    }

    // settle will mint the next token to the highest bidder
    // it will reset the highest bid, bidder, auction period and increment the token ID
    function settle() public {
        require(
            block.timestamp > deadline,
            "Current auction period is still active"
        );

        _mint(highestBidder, tokenId);

        emit Mint(tokenId, highestBidder);

        tokenId++;
        highestBid = 0;
        highestBidder = fallbackAddress;
        deadline = block.timestamp + 1 days;
    }
}
