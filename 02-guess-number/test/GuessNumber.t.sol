// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/GuessNumber.sol";

contract CounterTest is Test {
    GuessNumber public guessNumber;

    function setUp() public {
        // minimum wager is 0.001
        guessNumber = new GuessNumber(5, 1000000000000000);
    }

    function testIncrement() public {
        guessNumber.submitGuess(2);
        assertEq(counter.number(), 1);
    }

    function testSetNumber(uint256 x) public {
        counter.setNumber(x);
        assertEq(counter.number(), x);
    }
}
