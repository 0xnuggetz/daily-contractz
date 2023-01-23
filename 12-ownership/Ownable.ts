import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("Ownable", function () {
  async function setup() {
    const [owner, acct1] = await ethers.getSigners();
    const OwnableFactory = await ethers.getContractFactory("Ownable");
    const ownableContract = await OwnableFactory.deploy(owner.address);

    const ClaimableFactory = await ethers.getContractFactory(
      "OwnableWithClaim"
    );
    const claimableContract = await ClaimableFactory.deploy(owner.address);

    return { ownableContract, claimableContract, owner, acct1 };
  }

  async function setupClaimed() {
    const [owner, acct1] = await ethers.getSigners();

    const ClaimableFactory = await ethers.getContractFactory(
      "OwnableWithClaim"
    );
    const claimableContract = await ClaimableFactory.deploy(owner.address);

    await claimableContract.claimOwnership();

    return { claimableContract, owner, acct1 };
  }

  describe("Ownable", function () {
    it("should store correct initial owner", async function () {
      const { ownableContract, owner } = await loadFixture(setup);

      expect(await ownableContract.owner()).to.equal(owner.address);
    });

    it("should successfully transfer ownership", async function () {
      const { ownableContract, owner, acct1 } = await loadFixture(setup);

      expect(await ownableContract.owner()).to.equal(owner.address);

      await expect(ownableContract.transferOwnership(acct1.address))
        .to.emit(ownableContract, "OwnershipTransferred")
        .withArgs(owner.address, acct1.address);

      expect(await ownableContract.owner()).to.equal(acct1.address);
    });

    it("should prevent unauthorized transfer of ownership", async function () {
      const { ownableContract, owner, acct1 } = await loadFixture(setup);

      expect(await ownableContract.owner()).to.equal(owner.address);

      await expect(
        ownableContract.connect(acct1).transferOwnership(acct1.address)
      ).to.be.revertedWith("Caller is not owner");

      expect(await ownableContract.owner()).to.equal(owner.address);
    });

    it("should successfully renounce ownership", async function () {
      const { ownableContract, owner, acct1 } = await loadFixture(setup);

      expect(await ownableContract.owner()).to.equal(owner.address);

      await expect(ownableContract.renounceOwnership())
        .to.emit(ownableContract, "OwnershipTransferred")
        .withArgs(owner.address, ethers.constants.AddressZero);

      expect(await ownableContract.owner()).to.equal(
        ethers.constants.AddressZero
      );
    });
  });

  describe("OwnableWithClaim", function () {
    it("should store correct initial owner and pending owner", async function () {
      const { claimableContract, owner } = await loadFixture(setup);

      expect(await claimableContract.owner()).to.equal(
        ethers.constants.AddressZero
      );

      expect(await claimableContract.pendingOwner()).to.equal(owner.address);
    });

    it("should successfully claim ownership", async function () {
      const { claimableContract, owner } = await loadFixture(setup);

      expect(await claimableContract.owner()).to.equal(
        ethers.constants.AddressZero
      );

      expect(await claimableContract.pendingOwner()).to.equal(owner.address);

      await expect(claimableContract.claimOwnership())
        .to.emit(claimableContract, "OwnershipTransferred")
        .withArgs(ethers.constants.AddressZero, owner.address);

      expect(await claimableContract.owner()).to.equal(owner.address);
      expect(await claimableContract.pendingOwner()).to.equal(
        ethers.constants.AddressZero
      );
    });

    it("should prevent unauthorized claim ownership", async function () {
      const { claimableContract, owner, acct1 } = await loadFixture(setup);

      expect(await claimableContract.owner()).to.equal(
        ethers.constants.AddressZero
      );

      expect(await claimableContract.pendingOwner()).to.equal(owner.address);

      await expect(
        claimableContract.connect(acct1).claimOwnership()
      ).to.be.revertedWith("Caller is not pending owner");
    });

    it("should successfully transfer ownership before claim", async function () {
      const { claimableContract, owner, acct1 } = await loadFixture(
        setupClaimed
      );

      expect(await claimableContract.owner()).to.equal(owner.address);

      await expect(claimableContract.transferOwnership(acct1.address))
        .to.emit(claimableContract, "OwnershipTransferPending")
        .withArgs(owner.address, acct1.address);

      expect(await claimableContract.owner()).to.equal(owner.address);
      expect(await claimableContract.pendingOwner()).to.equal(acct1.address);
    });

    it("should prevent unauthorized transfer of ownership", async function () {
      const { claimableContract, owner, acct1 } = await loadFixture(
        setupClaimed
      );

      expect(await claimableContract.owner()).to.equal(owner.address);

      await expect(
        claimableContract.connect(acct1).transferOwnership(acct1.address)
      ).to.be.revertedWith("Caller is not owner");
    });

    it("should successfully renounce ownership", async function () {
      const { claimableContract, owner, acct1 } = await loadFixture(
        setupClaimed
      );

      expect(await claimableContract.owner()).to.equal(owner.address);

      await expect(claimableContract.renounceOwnership())
        .to.emit(claimableContract, "OwnershipTransferred")
        .withArgs(owner.address, ethers.constants.AddressZero);

      expect(await claimableContract.pendingOwner()).to.equal(
        ethers.constants.AddressZero
      );

      expect(await claimableContract.owner()).to.equal(
        ethers.constants.AddressZero
      );
    });
  });
});
