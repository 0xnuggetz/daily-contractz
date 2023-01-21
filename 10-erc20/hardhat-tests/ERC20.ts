import { expect } from "chai";
import { ethers } from "hardhat";

const INITIAL_SUPPLY = 1000;

describe("ERC20", function () {
  async function setup() {
    const [owner, acct1, acct2, acct3] = await ethers.getSigners();
    const ERC20 = await ethers.getContractFactory("ERC20");
    const mockToken = await ERC20.deploy(INITIAL_SUPPLY);
    return { mockToken, owner, acct1, acct2, acct3 };
  }

  describe("totalSupply", function () {
    it("should return the correct total supply", async function () {
      const { mockToken } = await setup();
      expect(await mockToken.totalSupply()).to.equal(INITIAL_SUPPLY);
    });
  });

  describe("balanceOf", function () {
    it("should return the default balance of accounts", async function () {
      const { mockToken, owner, acct1, acct2, acct3 } = await setup();

      expect(await mockToken.balanceOf(owner.address)).to.equal(1000);
      expect(await mockToken.balanceOf(acct1.address)).to.equal(0);
      expect(await mockToken.balanceOf(acct2.address)).to.equal(0);
      expect(await mockToken.balanceOf(acct3.address)).to.equal(0);
    });

    it("should return the correct balance of accounts after transfer", async function () {
      const { mockToken, owner, acct1, acct2, acct3 } = await setup();

      await mockToken.connect(owner).transfer(acct1.address, 100);
      await mockToken.connect(owner).transfer(acct2.address, 100);
      await mockToken.connect(owner).transfer(acct3.address, 100);

      expect(await mockToken.balanceOf(owner.address)).to.equal(700);
      expect(await mockToken.balanceOf(acct1.address)).to.equal(100);
      expect(await mockToken.balanceOf(acct2.address)).to.equal(100);
      expect(await mockToken.balanceOf(acct3.address)).to.equal(100);

      await mockToken.connect(acct1).transfer(acct2.address, 50);

      expect(await mockToken.balanceOf(acct1.address)).to.equal(50);
      expect(await mockToken.balanceOf(acct2.address)).to.equal(150);

      await mockToken.connect(acct2).transfer(acct3.address, 25);

      expect(await mockToken.balanceOf(acct2.address)).to.equal(125);
      expect(await mockToken.balanceOf(acct3.address)).to.equal(125);

      await mockToken.connect(acct3).transfer(acct1.address, 125);

      expect(await mockToken.balanceOf(acct1.address)).to.equal(175);
      expect(await mockToken.balanceOf(acct3.address)).to.equal(0);
    });
  });

  describe("allowance", function () {
    it("should return default allowance of accounts", async function () {
      const { mockToken, owner, acct1, acct2, acct3 } = await setup();

      expect(await mockToken.allowance(owner.address, acct1.address)).to.equal(
        0
      );
      expect(await mockToken.allowance(acct1.address, owner.address)).to.equal(
        0
      );
      expect(await mockToken.allowance(acct2.address, acct3.address)).to.equal(
        0
      );
      expect(await mockToken.allowance(acct2.address, acct3.address)).to.equal(
        0
      );
    });

    it("should return correct allowance of accounts after approval", async function () {
      const { mockToken, owner, acct1 } = await setup();

      expect(await mockToken.allowance(owner.address, acct1.address)).to.equal(
        0
      );

      await mockToken.connect(owner).approve(acct1.address, 100);

      expect(await mockToken.allowance(owner.address, acct1.address)).to.equal(
        100
      );

      expect(await mockToken.allowance(acct1.address, owner.address)).to.equal(
        0
      );

      await mockToken.connect(acct1).approve(owner.address, 100);

      expect(await mockToken.allowance(acct1.address, owner.address)).to.equal(
        100
      );
    });
  });

  describe("transfer", function () {
    it("should transfer zero in value", async function () {
      const { mockToken, owner, acct1 } = await setup();

      await expect(mockToken.connect(owner).transfer(acct1.address, 0))
        .to.emit(mockToken, "Transfer")
        .withArgs(owner.address, acct1.address, 0);
    });

    it("should transfer non-zero in value", async function () {
      const { mockToken, owner, acct1 } = await setup();

      expect(await mockToken.balanceOf(owner.address)).to.equal(1000);

      await expect(mockToken.connect(owner).transfer(acct1.address, 100))
        .to.emit(mockToken, "Transfer")
        .withArgs(owner.address, acct1.address, 100);

      expect(await mockToken.balanceOf(owner.address)).to.equal(900);
      expect(await mockToken.balanceOf(acct1.address)).to.equal(100);
    });

    it("should prevent transferring more than balance", async function () {
      const { mockToken, owner, acct1 } = await setup();

      expect(await mockToken.balanceOf(owner.address)).to.equal(1000);

      await expect(
        mockToken.connect(owner).transfer(acct1.address, 1100)
      ).to.be.revertedWith(
        "Sender does not have sufficient balance to transfer"
      );

      expect(await mockToken.balanceOf(owner.address)).to.equal(1000);
      expect(await mockToken.balanceOf(acct1.address)).to.equal(0);
    });
  });

  describe("transferFrom", function () {
    it("should prevent non-authorized spender from transferring", async function () {
      const { mockToken, owner, acct1 } = await setup();

      expect(await mockToken.balanceOf(owner.address)).to.equal(1000);

      await expect(
        mockToken
          .connect(acct1)
          .transferFrom(owner.address, acct1.address, 1000)
      ).to.be.revertedWith(
        "Spender does not have sufficient allowance to transfer"
      );

      expect(await mockToken.balanceOf(owner.address)).to.equal(1000);
      expect(await mockToken.balanceOf(acct1.address)).to.equal(0);
    });

    it("should prevent spender from transferring more than balance", async function () {
      const { mockToken, owner, acct1 } = await setup();

      expect(await mockToken.balanceOf(owner.address)).to.equal(1000);
      await mockToken.approve(acct1.address, 1100);

      await expect(
        mockToken
          .connect(acct1)
          .transferFrom(owner.address, acct1.address, 1100)
      ).to.be.revertedWith(
        "Owner does not have sufficient balance to transfer"
      );

      expect(await mockToken.balanceOf(owner.address)).to.equal(1000);
      expect(await mockToken.balanceOf(acct1.address)).to.equal(0);
    });

    it("should transferFrom zero in value", async function () {
      const { mockToken, owner, acct1 } = await setup();

      expect(await mockToken.balanceOf(owner.address)).to.equal(1000);
      await mockToken.approve(acct1.address, 1000);

      await expect(
        mockToken.connect(acct1).transferFrom(owner.address, acct1.address, 0)
      )
        .to.emit(mockToken, "Transfer")
        .withArgs(owner.address, acct1.address, 0);

      expect(await mockToken.balanceOf(owner.address)).to.equal(1000);
      expect(await mockToken.balanceOf(acct1.address)).to.equal(0);
    });

    it("should transferFrom non-zero in value", async function () {
      const { mockToken, owner, acct1 } = await setup();

      expect(await mockToken.balanceOf(owner.address)).to.equal(1000);
      await mockToken.connect(owner).approve(acct1.address, 1000);

      await expect(
        mockToken.connect(acct1).transferFrom(owner.address, acct1.address, 100)
      )
        .to.emit(mockToken, "Transfer")
        .withArgs(owner.address, acct1.address, 100);

      expect(await mockToken.balanceOf(owner.address)).to.equal(900);
      expect(await mockToken.balanceOf(acct1.address)).to.equal(100);
    });
  });

  describe("approve", function () {
    it("should approve zero value", async function () {
      const { mockToken, owner, acct1 } = await setup();

      expect(await mockToken.balanceOf(owner.address)).to.equal(1000);
      await mockToken.approve(acct1.address, 0);

      await expect(await mockToken.approve(acct1.address, 0))
        .to.emit(mockToken, "Approval")
        .withArgs(owner.address, acct1.address, 0);

      await expect(
        mockToken.connect(acct1).transferFrom(owner.address, acct1.address, 1)
      ).to.be.revertedWith(
        "Spender does not have sufficient allowance to transfer"
      );

      expect(await mockToken.balanceOf(owner.address)).to.equal(1000);
      expect(await mockToken.balanceOf(acct1.address)).to.equal(0);

      expect(await mockToken.allowance(owner.address, acct1.address)).to.equal(
        0
      );
    });

    it("should approve non-zero value", async function () {
      const { mockToken, owner, acct1 } = await setup();

      expect(await mockToken.balanceOf(owner.address)).to.equal(1000);

      await expect(await mockToken.approve(acct1.address, 100))
        .to.emit(mockToken, "Approval")
        .withArgs(owner.address, acct1.address, 100);

      expect(await mockToken.allowance(owner.address, acct1.address)).to.equal(
        100
      );
    });

    it("should prevent spending more than allowance", async function () {
      const { mockToken, owner, acct1 } = await setup();

      expect(await mockToken.balanceOf(owner.address)).to.equal(1000);
      expect(await mockToken.balanceOf(acct1.address)).to.equal(0);

      await expect(await mockToken.approve(acct1.address, 500))
        .to.emit(mockToken, "Approval")
        .withArgs(owner.address, acct1.address, 500);

      expect(await mockToken.allowance(owner.address, acct1.address)).to.equal(
        500
      );

      await expect(
        mockToken.connect(acct1).transferFrom(owner.address, acct1.address, 300)
      )
        .to.emit(mockToken, "Transfer")
        .withArgs(owner.address, acct1.address, 300);

      expect(await mockToken.allowance(owner.address, acct1.address)).to.equal(
        200
      );

      await expect(
        mockToken.connect(acct1).transferFrom(owner.address, acct1.address, 300)
      ).to.be.revertedWith(
        "Spender does not have sufficient allowance to transfer"
      );

      expect(await mockToken.balanceOf(owner.address)).to.equal(700);
      expect(await mockToken.balanceOf(acct1.address)).to.equal(300);
    });

    it("should replace first approval with second approval", async function () {
      const { mockToken, owner, acct1 } = await setup();

      expect(await mockToken.balanceOf(owner.address)).to.equal(1000);
      expect(await mockToken.balanceOf(acct1.address)).to.equal(0);

      await expect(await mockToken.approve(acct1.address, 500))
        .to.emit(mockToken, "Approval")
        .withArgs(owner.address, acct1.address, 500);

      expect(await mockToken.allowance(owner.address, acct1.address)).to.equal(
        500
      );

      await expect(
        mockToken.connect(acct1).transferFrom(owner.address, acct1.address, 300)
      )
        .to.emit(mockToken, "Transfer")
        .withArgs(owner.address, acct1.address, 300);

      expect(await mockToken.allowance(owner.address, acct1.address)).to.equal(
        200
      );

      await expect(await mockToken.approve(acct1.address, 0))
        .to.emit(mockToken, "Approval")
        .withArgs(owner.address, acct1.address, 0);

      expect(await mockToken.allowance(owner.address, acct1.address)).to.equal(
        0
      );

      await expect(
        mockToken.connect(acct1).transferFrom(owner.address, acct1.address, 300)
      ).to.be.revertedWith(
        "Spender does not have sufficient allowance to transfer"
      );

      expect(await mockToken.balanceOf(owner.address)).to.equal(700);
      expect(await mockToken.balanceOf(acct1.address)).to.equal(300);
    });

    it("should allow approval of more than balance", async function () {
      const { mockToken, owner, acct1, acct2 } = await setup();

      expect(await mockToken.balanceOf(owner.address)).to.equal(1000);

      await mockToken.transfer(acct1.address, 200);

      expect(await mockToken.balanceOf(acct1.address)).to.equal(200);

      await expect(await mockToken.connect(acct1).approve(acct2.address, 500))
        .to.emit(mockToken, "Approval")
        .withArgs(acct1.address, acct2.address, 500);

      expect(await mockToken.allowance(acct1.address, acct2.address)).to.equal(
        500
      );

      await expect(
        mockToken.connect(acct2).transferFrom(acct1.address, acct2.address, 200)
      )
        .to.emit(mockToken, "Transfer")
        .withArgs(acct1.address, acct2.address, 200);

      expect(await mockToken.balanceOf(acct1.address)).to.equal(0);

      expect(await mockToken.balanceOf(acct2.address)).to.equal(200);

      expect(await mockToken.allowance(acct1.address, acct2.address)).to.equal(
        300
      );

      await expect(
        mockToken.connect(acct2).transferFrom(acct1.address, acct2.address, 1)
      ).to.be.revertedWith(
        "Owner does not have sufficient balance to transfer"
      );

      await mockToken.transfer(acct1.address, 500);

      await expect(
        mockToken.connect(acct2).transferFrom(acct1.address, acct2.address, 300)
      )
        .to.emit(mockToken, "Transfer")
        .withArgs(acct1.address, acct2.address, 300);

      expect(await mockToken.allowance(owner.address, acct1.address)).to.equal(
        0
      );

      await expect(
        mockToken.connect(acct2).transferFrom(acct1.address, acct2.address, 100)
      ).to.be.revertedWith(
        "Spender does not have sufficient allowance to transfer"
      );

      expect(await mockToken.balanceOf(acct2.address)).to.equal(500);
    });
  });
});
