import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("DailyAuctionNFT", function () {
  async function setup() {
    const [fallback, bidder1, bidder2, bidder3, bidder4] =
      await ethers.getSigners();

    const DailyAuctionNFT = await ethers.getContractFactory("DailyAuctionNFT");
    const auctionNFTContract = await DailyAuctionNFT.deploy(fallback.address);

    return { auctionNFTContract, fallback, bidder1, bidder2, bidder3, bidder4 };
  }

  describe("bid", function () {
    it("should prevent bidding if 24 hours passed", async function () {
      const { auctionNFTContract, bidder1 } = await setup();

      await time.increase(86400);

      await expect(
        auctionNFTContract
          .connect(bidder1)
          .bid({ value: ethers.utils.parseEther("1") })
      ).to.be.revertedWith(
        "Current auction period has expired, auction must be settled"
      );
    });

    it("should successfully submit a bid", async function () {
      const { auctionNFTContract, bidder1 } = await setup();

      const initialBidder1Balance = await bidder1.getBalance();

      await auctionNFTContract
        .connect(bidder1)
        .bid({ value: ethers.utils.parseEther("1") });

      expect(await bidder1.getBalance()).to.within(
        initialBidder1Balance.sub(ethers.utils.parseEther("1.1")),
        initialBidder1Balance.sub(ethers.utils.parseEther("0.9"))
      );

      expect(
        await ethers.provider.getBalance(auctionNFTContract.address)
      ).to.equal(ethers.utils.parseEther("1"));

      expect(await auctionNFTContract.highestBid()).to.equal(
        ethers.utils.parseEther("1")
      );

      expect(await auctionNFTContract.highestBidder()).to.equal(
        bidder1.address
      );
    });

    it("should prevent bidding if smaller than highest bid amount", async function () {
      const { auctionNFTContract, bidder1, bidder2 } = await setup();

      await auctionNFTContract
        .connect(bidder1)
        .bid({ value: ethers.utils.parseEther("1") });

      await expect(
        auctionNFTContract
          .connect(bidder2)
          .bid({ value: ethers.utils.parseEther("0.9") })
      ).to.be.revertedWith("Value is not higher than the current highest bid");
    });

    it("should refund first bidder if second bidder bids higher", async function () {
      const { auctionNFTContract, bidder1, bidder2 } = await setup();

      const initialBidder1Balance = await bidder1.getBalance();

      await auctionNFTContract
        .connect(bidder1)
        .bid({ value: ethers.utils.parseEther("1") });

      expect(await bidder1.getBalance()).to.within(
        initialBidder1Balance.sub(ethers.utils.parseEther("1.1")),
        initialBidder1Balance.sub(ethers.utils.parseEther("0.9"))
      );

      expect(
        await ethers.provider.getBalance(auctionNFTContract.address)
      ).to.equal(ethers.utils.parseEther("1"));

      expect(await auctionNFTContract.highestBid()).to.equal(
        ethers.utils.parseEther("1")
      );

      expect(await auctionNFTContract.highestBidder()).to.equal(
        bidder1.address
      );

      await expect(
        auctionNFTContract
          .connect(bidder2)
          .bid({ value: ethers.utils.parseEther("1.2") })
      )
        .to.emit(auctionNFTContract, "Refund")
        .withArgs(ethers.utils.parseEther("1"), bidder1.address);

      expect(await bidder1.getBalance()).to.within(
        initialBidder1Balance.sub(ethers.utils.parseEther("0.1")),
        initialBidder1Balance
      );

      expect(
        await ethers.provider.getBalance(auctionNFTContract.address)
      ).to.equal(ethers.utils.parseEther("1.2"));

      expect(await auctionNFTContract.highestBid()).to.equal(
        ethers.utils.parseEther("1.2")
      );

      expect(await auctionNFTContract.highestBidder()).to.equal(
        bidder2.address
      );
    });
  });

  describe("settle", function () {
    it("should prevent settling a bid if auction ongoing", async function () {
      const { auctionNFTContract } = await setup();

      await expect(auctionNFTContract.settle()).to.be.revertedWith(
        "Current auction period is still active"
      );
    });

    it("should successfully settle a bid to fallback", async function () {
      const { auctionNFTContract, fallback, bidder1 } = await setup();

      await time.increase(86400);

      await expect(auctionNFTContract.connect(bidder1).settle())
        .to.emit(auctionNFTContract, "Mint")
        .withArgs(1, fallback.address);

      expect(await auctionNFTContract.balanceOf(fallback.address)).to.equal(1);

      expect(await auctionNFTContract.tokenId()).to.equal(2);
    });

    it("should successfully settle a bid to highest bidder", async function () {
      const { auctionNFTContract, fallback, bidder1 } = await setup();

      const initialDeadline = await auctionNFTContract.deadline();

      await auctionNFTContract
        .connect(bidder1)
        .bid({ value: ethers.utils.parseEther("1") });

      expect(await auctionNFTContract.highestBid()).to.equal(
        ethers.utils.parseEther("1")
      );

      expect(await auctionNFTContract.highestBidder()).to.equal(
        bidder1.address
      );

      await time.increase(86400);

      await expect(auctionNFTContract.connect(bidder1).settle())
        .to.emit(auctionNFTContract, "Mint")
        .withArgs(1, bidder1.address);

      expect(await auctionNFTContract.balanceOf(bidder1.address)).to.equal(1);

      expect(await auctionNFTContract.highestBid()).to.equal(
        ethers.utils.parseEther("0")
      );

      expect(await auctionNFTContract.highestBidder()).to.equal(
        fallback.address
      );

      expect(await auctionNFTContract.tokenId()).to.equal(2);

      expect(initialDeadline < (await auctionNFTContract.deadline()));
    });
  });
});
