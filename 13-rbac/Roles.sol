// SPDX-License-Idenfitier: Deez Nuggz
pragma solidity ^0.8.17;

import "./Ownable.sol";

contract Roles is Ownable {
    mapping(address => mapping(bytes32 => bool)) registry;

    modifier onlyAdmin() {
        require(registry[msg.sender]["ADMIN"], "msg.sender is not admin");
        _;
    }

    modifier onlyRole(bytes32 role) {
        require(registry[msg.sender][role], "msg.sender does not have access");
        _;
    }

    constructor(address _initialOwner) Ownable(_initialOwner) {}

    function hasRole(address addr, bytes32 role) public view returns (bool) {
        return registry[addr][role];
    }

    function grantAdmin(address addr) public onlyOwner {
        registry[addr]["ADMIN"] = true;
    }

    function revokeAdmin(address addr) public onlyOwner {
        registry[addr]["ADMIN"] = false;
    }

    function grantRole(address addr, bytes32 role) public onlyAdmin {
        registry[addr][role] = true;
    }

    function revokeRole(address addr, bytes32 role) public onlyAdmin {
        registry[addr][role] = false;
    }
}
