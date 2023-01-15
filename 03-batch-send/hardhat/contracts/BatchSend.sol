pragma solidity ^0.8.17;

import "hardhat/console.sol";

contract BatchSend {
    function batchSend(address[] calldata recipients, uint256[] calldata values)
        external
        payable
    {
        for (uint256 i = 0; i < recipients.length; i++) {
            (bool sent, ) = recipients[i].call{value: values[i]}("");
            require(sent, "Send failed");
        }
        if (address(this).balance > 0)
            msg.sender.call{value: address(this).balance}("");
    }
}
