// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract Greeter {
    string greeting;

    constructor(string memory firstGreeting) {
        greeting = firstGreeting;
    }

    function getGreeting() public view returns (string memory) {
        return greeting;
    }

    function setGreeting(string calldata newGreeting) public {
        greeting = newGreeting;
    }
}
