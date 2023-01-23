import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

const INITIAL_SUPPLY = 10;

describe("ERC721", function () {
  async function setup() {
    const [owner, acct1] = await ethers.getSigners();
    const ERC721Factory = await ethers.getContractFactory("ERC721");
    const tokenContract = await ERC721Factory.deploy(INITIAL_SUPPLY);

    const ReceiverFactory = await ethers.getContractFactory("MockReceiver");
    const receiverContract = await ReceiverFactory.deploy();

    const NonReceiverFactory = await ethers.getContractFactory(
      "MockNonReceiver"
    );
    const nonReceiverContract = await NonReceiverFactory.deploy();

    return {
      tokenContract,
      receiverContract,
      nonReceiverContract,
      owner,
      acct1,
    };
  }

  describe("balanceOf", function () {
    it("should return a correct initial balance", async function () {
      const { tokenContract, owner } = await loadFixture(setup);

      expect(await tokenContract.balanceOf(owner.address)).to.equal(
        INITIAL_SUPPLY
      );
    });

    it("should return correct balances after transfer", async function () {
      const { tokenContract, owner, acct1 } = await loadFixture(setup);

      for (let i = 1; i <= 10; i++) {
        await tokenContract.transferFrom(owner.address, acct1.address, i);
      }

      expect(await tokenContract.balanceOf(owner.address)).to.equal(
        INITIAL_SUPPLY - 10
      );

      expect(await tokenContract.balanceOf(acct1.address)).to.equal(10);
    });
  });

  describe("ownerOf", function () {
    it("should return the correct initial owner", async function () {
      const { tokenContract, owner } = await loadFixture(setup);

      for (let i = 1; i <= 10; i++) {
        expect(await tokenContract.ownerOf(i)).to.equal(owner.address);
      }
    });

    it("should return the correct owners after transfer", async function () {
      const { tokenContract, owner, acct1 } = await loadFixture(setup);

      for (let i = 1; i <= 10; i++) {
        await tokenContract.transferFrom(owner.address, acct1.address, i);
      }

      for (let i = 1; i <= 10; i++) {
        expect(await tokenContract.ownerOf(i)).to.equal(acct1.address);
      }
    });
  });

  describe("transferFrom", function () {
    it("should not allow transfer from non-approved account", async function () {
      const { tokenContract, owner, acct1 } = await loadFixture(setup);

      await expect(
        tokenContract
          .connect(acct1)
          .transferFrom(owner.address, acct1.address, 1)
      ).to.be.revertedWith("Unauthorized sender");
    });

    it("should allow transfer from approved account", async function () {
      const { tokenContract, owner, acct1 } = await loadFixture(setup);

      await tokenContract.approve(acct1.address, 1);

      await expect(
        tokenContract
          .connect(acct1)
          .transferFrom(owner.address, acct1.address, 1)
      )
        .to.emit(tokenContract, "Transfer")
        .withArgs(owner.address, acct1.address, 1);
    });
  });

  describe("safeTransferFrom", function () {
    it("should allow transfer from EOA", async function () {
      const { tokenContract, owner, acct1 } = await loadFixture(setup);

      await expect(
        tokenContract["safeTransferFrom(address,address,uint256)"](
          owner.address,
          acct1.address,
          1
        )
      )
        .to.emit(tokenContract, "Transfer")
        .withArgs(owner.address, acct1.address, 1);
    });

    it("should allow transfer to contract that can receive ERC721", async function () {
      const { tokenContract, owner, receiverContract } = await loadFixture(
        setup
      );

      await expect(
        tokenContract["safeTransferFrom(address,address,uint256)"](
          owner.address,
          receiverContract.address,
          1
        )
      )
        .to.emit(tokenContract, "Transfer")
        .withArgs(owner.address, receiverContract.address, 1);

      expect(await tokenContract.ownerOf(1)).to.equal(receiverContract.address);
    });

    it("should not allow transfer to contract that cannot receive ERC721", async function () {
      const { tokenContract, owner, nonReceiverContract } = await loadFixture(
        setup
      );

      await expect(
        tokenContract["safeTransferFrom(address,address,uint256)"](
          owner.address,
          nonReceiverContract.address,
          1
        )
      ).to.be.revertedWith("Recipient address does not handle ERC721 tokens");
    });
  });

  describe("approve and getApproved", function () {
    it("should return the correct initial approval", async function () {
      const { tokenContract } = await loadFixture(setup);

      expect(await tokenContract.getApproved(1)).to.equal(
        ethers.constants.AddressZero
      );
    });

    it("should prevent anyone from approving token", async function () {
      const { tokenContract, acct1 } = await loadFixture(setup);

      expect(await tokenContract.getApproved(1)).to.equal(
        ethers.constants.AddressZero
      );

      await expect(
        tokenContract.connect(acct1).approve(acct1.address, 1)
      ).to.be.revertedWith("Unauthorized approver");
    });

    it("should validate correct operator after approval", async function () {
      const { tokenContract, acct1 } = await loadFixture(setup);

      expect(await tokenContract.getApproved(1)).to.equal(
        ethers.constants.AddressZero
      );

      await tokenContract.approve(acct1.address, 1);

      expect(await tokenContract.getApproved(1)).to.equal(acct1.address);
    });
  });

  describe("setApprovalForAll and isApprovedForAll", function () {
    it("should return the correct initial approval", async function () {
      const { tokenContract, owner, acct1 } = await loadFixture(setup);

      expect(
        await tokenContract.isApprovedForAll(owner.address, acct1.address)
      ).to.equal(false);
    });

    it("should validate correct operator after approval", async function () {
      const { tokenContract, owner, acct1 } = await loadFixture(setup);

      expect(
        await tokenContract.isApprovedForAll(owner.address, acct1.address)
      ).to.equal(false);

      await tokenContract.setApprovalForAll(acct1.address, true);

      expect(
        await tokenContract.isApprovedForAll(owner.address, acct1.address)
      ).to.equal(true);
    });
  });
});
