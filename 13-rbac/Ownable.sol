// SPDX-License-Identifier: Deez Nuggz
pragma solidity ^0.8.17;

contract Ownable {
    address public owner;

    event OwnershipTransferred(address _prevOwner, address _newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not owner");
        _;
    }

    constructor(address _initialOwner) {
        _transferOwnership(_initialOwner);
    }

    function transferOwnership(address _newOwner) public onlyOwner {
        _transferOwnership(_newOwner);
    }

    function renounceOwnership() public onlyOwner {
        _transferOwnership(address(0));
    }

    function _transferOwnership(address _newOwner) internal {
        address prevOwner = owner;
        owner = _newOwner;

        emit OwnershipTransferred(prevOwner, owner);
    }
}
