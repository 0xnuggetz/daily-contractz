// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/* 
    1. create a proposal with voting deadline
    2. vote on it during time period
    3. execute on-chain proposal
 */

enum Vote {
    For,
    Against,
    Abstain
}

contract Governance {
    ERC20 public VotingToken;
    uint256 public proposalId;
    uint256 public votingPeriod;
    mapping(uint256 => address[]) proposalTargets;
    mapping(uint256 => uint256[]) proposalValues;
    mapping(uint256 => bytes[]) proposalCalldatas;
    mapping(uint256 => string) proposalMetadata;
    mapping(uint256 => uint256) proposalDeadline;
    mapping(uint256 => mapping(Vote => uint256)) public proposalVotes;
    mapping(address => mapping(uint256 => bool)) public voteHistory;

    event CallSuccess(uint256 callIndex, bytes returnData);
    event CallFailed(uint256 callIndex, bytes returnData);

    constructor(address votingToken, uint256 _votingPeriod) {
        VotingToken = ERC20(votingToken);
        votingPeriod = _votingPeriod;
    }

    modifier isQuorumReached(uint256 _proposalId) {
        uint256 totalVotes = proposalVotes[_proposalId][Vote.For];
        totalVotes += proposalVotes[_proposalId][Vote.Against];
        totalVotes += proposalVotes[_proposalId][Vote.Abstain];
        require(
            proposalVotes[_proposalId][Vote.For] > totalVotes / 2,
            "Quorum was not reached"
        );
        _;
    }

    modifier isVotingCompleted(uint256 _proposalId) {
        require(
            block.number > proposalDeadline[_proposalId],
            "Voting period is still open"
        );
        _;
    }

    modifier isValidVotingPeriod(uint256 _proposalId) {
        require(
            proposalDeadline[_proposalId] > block.number,
            "Voting deadline has passed"
        );
        _;
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

    function createProposal(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory metadata
    ) public {
        require(targets.length > 0, "Invalid targets length");
        require(targets.length == values.length, "Invalid params length");
        require(targets.length == calldatas.length, "Invalid params length");

        proposalTargets[proposalId] = targets;
        proposalValues[proposalId] = values;
        proposalCalldatas[proposalId] = calldatas;
        proposalMetadata[proposalId] = metadata;

        uint256 deadline = block.number + votingPeriod;
        proposalDeadline[proposalId] = deadline;

        proposalId++;
    }

    function voteProposal(uint256 _proposalId, uint256 voteType)
        external
        isValidVoteType(voteType)
        isValidVotingPeriod(_proposalId)
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

    function executeProposal(uint256 _proposalId)
        public
        isVotingCompleted(_proposalId)
        isQuorumReached(_proposalId)
    {
        for (uint256 i = 0; i < proposalTargets[_proposalId].length; i++) {
            (bool success, bytes memory returnData) = proposalTargets[
                _proposalId
            ][i].call{value: proposalValues[_proposalId][i]}(
                proposalCalldatas[_proposalId][i]
            );
            if (success) {
                emit CallSuccess(i, returnData);
            } else {
                emit CallFailed(i, returnData);
            }
        }
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

    function getTotalVotes(uint256 _proposalId)
        external
        view
        returns (uint256 numVotes)
    {
        return
            proposalVotes[_proposalId][Vote.For] +
            proposalVotes[_proposalId][Vote.Against] +
            proposalVotes[_proposalId][Vote.Abstain];
    }
}
