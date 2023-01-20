import { expect } from "chai";
import { ethers } from "hardhat";
import ERC20ABI from "./abi";

enum Vote {
  For,
  Against,
  Abstain,
}

const PROPOSAL_ZERO = 0;
const PROPOSAL_ONE = 1;

describe("Governance", function () {
  async function setup() {
    const [owner, voter1, voter2, voter3, voter4] = await ethers.getSigners();

    const MockToken = await ethers.getContractFactory("MockToken");
    const mockToken = await MockToken.deploy(); // 1000 deployed to owner

    const GovernanceContract = await ethers.getContractFactory("Governance");
    const governanceContract = await GovernanceContract.deploy(
      mockToken.address
    ); // 1000 deployed to owner

    await mockToken.approve(owner.address, mockToken.balanceOf(owner.address));

    expect(await governanceContract.VotingToken()).to.equal(mockToken.address);

    await mockToken.transferFrom(
      owner.address,
      voter1.address,
      ethers.utils.parseEther("100")
    );
    await mockToken.transferFrom(
      owner.address,
      voter2.address,
      ethers.utils.parseEther("125")
    );
    await mockToken.transferFrom(
      owner.address,
      voter3.address,
      ethers.utils.parseEther("150")
    );
    await mockToken.transferFrom(
      owner.address,
      voter4.address,
      ethers.utils.parseEther("200")
    );

    expect(await mockToken.balanceOf(voter1.address)).to.equal(
      ethers.utils.parseEther("100")
    );
    expect(await mockToken.balanceOf(voter2.address)).to.equal(
      ethers.utils.parseEther("125")
    );
    expect(await mockToken.balanceOf(voter3.address)).to.equal(
      ethers.utils.parseEther("150")
    );
    expect(await mockToken.balanceOf(voter4.address)).to.equal(
      ethers.utils.parseEther("200")
    );

    return {
      governanceContract,
      mockToken,
      owner,
      voter1,
      voter2,
      voter3,
      voter4,
    };
  }

  describe("createProposal", function () {
    it("Should create a proposal", async function () {
      const { governanceContract, mockToken, owner, voter1, voter2 } =
        await setup();

      const erc20Interface = new ethers.utils.Interface(ERC20ABI);

      const calldata1 = erc20Interface.encodeFunctionData("transferFrom", [
        owner.address,
        voter1.address,
        ethers.utils.parseEther("1"),
      ]);

      const calldata2 = erc20Interface.encodeFunctionData("transferFrom", [
        owner.address,
        voter2.address,
        ethers.utils.parseEther("1"),
      ]);

      await governanceContract.createProposal(
        [mockToken.address, mockToken.address],
        [0, 0],
        [calldata1, calldata2],
        "www.ipfs.io/metadata"
      );
      await governanceContract.createProposal("www.ipfs.io/metadata2");

      expect(await governanceContract.proposalId()).to.equal(2);

      expect(await governanceContract.proposalMetadata(PROPOSAL_ZERO)).to.equal(
        "www.ipfs.io/metadata"
      );

      expect(await governanceContract.proposalMetadata(PROPOSAL_ONE)).to.equal(
        "www.ipfs.io/metadata2"
      );
    });
  });

  describe("voteProposal", function () {
    it("Should vote for intended vote", async function () {
      const { governanceContract, mockToken, voter1, voter2, voter3 } =
        await setup();

      // setup proposals
      await governanceContract.createProposal("www.ipfs.io/metadata");
      await governanceContract.createProposal("www.ipfs.io/metadata2");

      const voter1Votes = await mockToken.balanceOf(voter1.address);
      const voter2Votes = await mockToken.balanceOf(voter2.address);
      const voter3Votes = await mockToken.balanceOf(voter3.address);

      await governanceContract
        .connect(voter1)
        .voteProposal(PROPOSAL_ZERO, Vote.For);

      expect(
        await governanceContract.getVotes(PROPOSAL_ZERO, Vote.For)
      ).to.equal(voter1Votes);

      expect(
        await governanceContract.getVotes(PROPOSAL_ZERO, Vote.Against)
      ).to.equal(0);

      expect(
        await governanceContract.getVotes(PROPOSAL_ZERO, Vote.Abstain)
      ).to.equal(0);

      await governanceContract
        .connect(voter2)
        .voteProposal(PROPOSAL_ONE, Vote.Against);

      expect(
        await governanceContract.getVotes(PROPOSAL_ONE, Vote.For)
      ).to.equal(0);

      expect(
        await governanceContract.getVotes(PROPOSAL_ONE, Vote.Against)
      ).to.equal(voter2Votes);

      expect(
        await governanceContract.getVotes(PROPOSAL_ONE, Vote.Abstain)
      ).to.equal(0);

      await governanceContract
        .connect(voter3)
        .voteProposal(PROPOSAL_ONE, Vote.Abstain);

      expect(
        await governanceContract.getVotes(PROPOSAL_ONE, Vote.For)
      ).to.equal(0);

      expect(
        await governanceContract.getVotes(PROPOSAL_ONE, Vote.Against)
      ).to.equal(voter2Votes);

      expect(
        await governanceContract.getVotes(PROPOSAL_ONE, Vote.Abstain)
      ).to.equal(voter3Votes);
    });

    it("Should accumulate votes", async function () {
      const { governanceContract, mockToken, voter1, voter2, voter3 } =
        await setup();

      // setup proposals
      await governanceContract.createProposal("www.ipfs.io/metadata");

      const voter1Votes = await mockToken.balanceOf(voter1.address);
      const voter2Votes = await mockToken.balanceOf(voter2.address);
      const voter3Votes = await mockToken.balanceOf(voter3.address);

      await governanceContract
        .connect(voter1)
        .voteProposal(PROPOSAL_ZERO, Vote.For);

      expect(
        await governanceContract.getVotes(PROPOSAL_ZERO, Vote.For)
      ).to.equal(voter1Votes);

      await governanceContract
        .connect(voter2)
        .voteProposal(PROPOSAL_ZERO, Vote.For);

      expect(
        await governanceContract.getVotes(PROPOSAL_ZERO, Vote.For)
      ).to.equal(voter1Votes.add(voter2Votes));

      await governanceContract
        .connect(voter3)
        .voteProposal(PROPOSAL_ZERO, Vote.For);

      expect(
        await governanceContract.getVotes(PROPOSAL_ZERO, Vote.For)
      ).to.equal(voter1Votes.add(voter2Votes).add(voter3Votes));
    });

    it("Should prevent double voting", async function () {
      const { governanceContract, mockToken, voter1, voter2, voter3 } =
        await setup();

      // setup proposals
      await governanceContract.createProposal("www.ipfs.io/metadata");

      const voter1Votes = await mockToken.balanceOf(voter1.address);

      await governanceContract
        .connect(voter1)
        .voteProposal(PROPOSAL_ZERO, Vote.For);

      expect(
        await governanceContract.getVotes(PROPOSAL_ZERO, Vote.For)
      ).to.equal(voter1Votes);

      await expect(
        governanceContract
          .connect(voter1)
          .voteProposal(PROPOSAL_ZERO, Vote.Against)
      ).to.be.revertedWith("Address has already voted for this proposal");

      expect(
        await governanceContract.hasVoted(voter1.address, PROPOSAL_ZERO)
      ).to.equal(true);
    });
  });
});
