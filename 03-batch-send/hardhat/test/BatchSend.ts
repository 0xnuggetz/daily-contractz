import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("BatchSend", function () {
  async function deploy() {
    const BatchSend = await ethers.getContractFactory("BatchSend");
    const deployedContract = await BatchSend.deploy();
    const [owner, account1, account2, account3] = await ethers.getSigners();

    return { deployedContract, owner, account1, account2, account3 };
  }

  describe("Batch Send", function () {
    let bsContract: Contract;
    let defaultAcct: SignerWithAddress;
    let acct1: SignerWithAddress;
    let acct2: SignerWithAddress;
    let acct3: SignerWithAddress;

    beforeEach(async function () {
      const { deployedContract, owner, account1, account2, account3 } =
        await deploy();
      bsContract = deployedContract;
      defaultAcct = owner;
      acct1 = account1;
      acct2 = account2;
      acct3 = account3;
    });

    it("Should send the right amount and return surplus", async function () {
      const initialBalance = await ethers.provider.getBalance(acct1.address);

      const addresses = [acct1.address, acct2.address, acct3.address];

      const amount = ethers.utils.parseEther("1");

      const values = [amount, amount, amount];

      await bsContract.batchSend(addresses, values, {
        value: ethers.utils.parseEther("4"),
      });

      expect(await ethers.provider.getBalance(defaultAcct.address)).to.within(
        initialBalance.sub(ethers.utils.parseEther("3.1")),
        initialBalance.sub(ethers.utils.parseEther("2.9"))
      );
      expect(await ethers.provider.getBalance(acct1.address)).to.equal(
        initialBalance.add(amount)
      );
      expect(await ethers.provider.getBalance(acct2.address)).to.equal(
        initialBalance.add(amount)
      );
      expect(await ethers.provider.getBalance(acct3.address)).to.equal(
        initialBalance.add(amount)
      );
    });

    it("Should revert when amount sent is not sufficient", async function () {
      const initialBalance = await ethers.provider.getBalance(acct1.address);

      const addresses = [acct1.address, acct2.address, acct3.address];

      const amount = ethers.utils.parseEther("1");

      const values = [amount, amount, amount];

      await expect(
        bsContract.batchSend(addresses, values, {
          value: ethers.utils.parseEther("1"),
        })
      ).to.be.revertedWith("Send failed");
    });
  });
});
