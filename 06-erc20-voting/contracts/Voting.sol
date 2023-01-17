// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/*

1. Create a proposal as mapping(id => metadata), mapping(id => votes)
2. Vote on proposal: for, against, abstain (enum)
3. Number of votes depends on how many ERC20s you own

*/

enum Vote {
    For,
    Against,
    Abstain
}

contract Voting {
    ERC20 public VotingToken;
    uint256 public proposalId;
    mapping(uint256 => string) public proposalMetadata;
    mapping(uint256 => mapping(Vote => uint256)) public proposalVotes;
    mapping(address => mapping(uint256 => bool)) public voteHistory;

    constructor(address votingToken) {
        VotingToken = ERC20(votingToken);
    }

    modifier isValidVoteType(uint256 voteType) {
        require(voteType < 3, "Vote type is invalid");
        _;
    }

    modifier hasAlreadyVoted(uint256 _proposalId) {
        require(
            voteHistory[msg.sender][_proposalId] == false,
            "Address has already voted for this proposal"
        );
        _;
    }

    function createProposal(string calldata metadataURL) external {
        proposalMetadata[proposalId] = metadataURL;
        proposalId++;
    }

    function voteProposal(uint256 _proposalId, uint256 voteType)
        external
        isValidVoteType(voteType)
        hasAlreadyVoted(_proposalId)
    {
        uint256 numOfVotes = VotingToken.balanceOf(msg.sender);

        if (voteType == 0) {
            proposalVotes[_proposalId][Vote.For] += numOfVotes;
        } else if (voteType == 1) {
            proposalVotes[_proposalId][Vote.Against] += numOfVotes;
        } else if (voteType == 2) {
            proposalVotes[_proposalId][Vote.Abstain] += numOfVotes;
        }

        voteHistory[msg.sender][_proposalId] = true;
    }

    function getVotes(uint256 _proposalId, uint256 voteType)
        external
        view
        isValidVoteType(voteType)
        returns (uint256 numVotes)
    {
        if (voteType == 0) {
            return proposalVotes[_proposalId][Vote.For];
        } else if (voteType == 1) {
            return proposalVotes[_proposalId][Vote.Against];
        } else if (voteType == 2) {
            return proposalVotes[_proposalId][Vote.Abstain];
        }
    }

    function hasVoted(address voter, uint256 _proposalId)
        external
        view
        returns (bool _hasVoted)
    {
        return voteHistory[voter][_proposalId];
    }
}
