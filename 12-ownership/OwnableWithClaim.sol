// SPDX-License-Identifier: Deez Nuggz
pragma solidity ^0.8.17;

contract OwnableWithClaim {
    address public owner;
    address public pendingOwner;

    event OwnershipTransferred(address _prevOwner, address _newOwner);
    event OwnershipTransferPending(address _prevOwner, address _newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not owner");
        _;
    }

    modifier onlyPendingOwner() {
        require(msg.sender == pendingOwner, "Caller is not pending owner");
        _;
    }

    constructor(address _initialOwner) {
        pendingOwner = _initialOwner;
    }

    function transferOwnership(address _newOwner) public onlyOwner {
        address prevOwner = owner;
        pendingOwner = _newOwner;

        emit OwnershipTransferPending(prevOwner, _newOwner);
    }

    function renounceOwnership() public onlyOwner {
        address prevOwner = owner;
        owner = address(0);

        emit OwnershipTransferred(prevOwner, address(0));
    }

    function claimOwnership() public onlyPendingOwner {
        address prevOwner = owner;
        owner = pendingOwner;
        pendingOwner = address(0);

        emit OwnershipTransferred(prevOwner, owner);
    }
}
