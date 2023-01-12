// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/Greeter.sol";

contract GreeterTest is Test {
    Greeter public greeter;
    string testGreeting = "gm!";

    function setUp() public {
        greeter = new Greeter(testGreeting);
    }

    function testGetGreeting() public {
        string memory greeting = greeter.getGreeting();
        assertEq(greeting, testGreeting);
    }
}
