// SPDX-License-Idenfitier: Deez Nuggz
pragma solidity ^0.8.17;

import "./Ownable.sol";

contract Insurance is Ownable {
    mapping(address => uint256) premiums;
    mapping(address => uint256) pendingClaims;
    mapping(address => uint256) totalClaimed;
    mapping(address => bool) isSubscribed;
    uint256 claimLimit;

    constructor(address _initialOwner) Ownable(_initialOwner) {}

    function payPremium() public payable {
        require(premiums[msg.sender] > 0, "msg.sender is not added");
        require(
            msg.value >= premiums[msg.sender],
            "msg.value is lower than premium"
        );
    }

    function submitClaim(uint256 _claim) public {
        require(
            totalClaimed[msg.sender] + _claim < claimLimit,
            "claim exceeded the claim limit"
        );
        pendingClaims[msg.sender] = _claim;
    }

    function approveClaim(address _claimee) internal onlyOwner {
        uint256 claim = pendingClaims[_claimee];
        (bool success, ) = _claimee.call{value: claim}("");
        pendingClaims[_claimee] -= claim;
        totalClaimed[_claimee] += claim;
    }

    function increasePremium(address _insuree, uint256 _amount)
        public
        onlyOwner
    {
        premiums[_insuree] += _amount;
    }

    function decreasePremium(address _insuree, uint256 _amount)
        public
        onlyOwner
    {
        require(_amount > premiums[_insuree]);
        premiums[_insuree] -= _amount;
    }

    function addInsuree(address _insuree, uint256 _premium) public onlyOwner {
        premiums[_insuree] = _premium;
    }
}
