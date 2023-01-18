import { expect } from "chai";
import { ethers } from "hardhat";
import ERC20ABI from "./abi";

describe("Executor", function () {
  async function setup() {
    const [owner, acct1, acct2] = await ethers.getSigners();

    const MockToken = await ethers.getContractFactory("MockToken");
    const mockToken = await MockToken.deploy(); // 1000 deployed to owner

    const ExecutorContract = await ethers.getContractFactory("Executor");
    const executorContract = await ExecutorContract.deploy(); // 1000 deployed to owner

    await mockToken.approve(owner.address, mockToken.balanceOf(owner.address));

    await mockToken.approve(
      executorContract.address,
      mockToken.balanceOf(owner.address)
    );

    return { executorContract, mockToken, owner, acct1, acct2 };
  }

  describe("execute", function () {
    it("Should execute calldata", async function () {
      const { executorContract, mockToken, owner, acct1, acct2 } =
        await setup();

      expect(await mockToken.balanceOf(acct1.address)).to.equal(
        ethers.utils.parseEther("0")
      );

      const erc20Interface = new ethers.utils.Interface(ERC20ABI);

      const calldata1 = erc20Interface.encodeFunctionData("transferFrom", [
        owner.address,
        acct1.address,
        ethers.utils.parseEther("1"),
      ]);

      const calldata2 = erc20Interface.encodeFunctionData("transferFrom", [
        owner.address,
        acct2.address,
        ethers.utils.parseEther("1"),
      ]);

      await executorContract.execute(
        [mockToken.address, mockToken.address],
        [0, 0],
        [calldata1, calldata2]
      );

      expect(await mockToken.balanceOf(acct1.address)).to.equal(
        ethers.utils.parseEther("1")
      );

      expect(await mockToken.balanceOf(acct2.address)).to.equal(
        ethers.utils.parseEther("1")
      );
    });
  });
});
