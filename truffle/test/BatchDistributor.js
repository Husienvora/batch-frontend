const BatchDistributor = artifacts.require("BatchDistributor");
const ERC20Mock = artifacts.require("ERC20Mock");
const ERC20ReturnFalseMock = artifacts.require("ERC20ReturnFalseMock");

const { BN, expectRevert, expectEvent } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");

contract("BatchDistributor", function (accounts) {
  const [owner, addr1, addr2, addr3, addr4] = accounts;
  let distributor, distributorAddr;
  let erc20, erc20Addr;
  let erc20ReturnFalse, erc20ReturnFalseAddr;

  beforeEach(async function () {
    distributor = await BatchDistributor.new();
    distributorAddr = distributor.address;

    erc20 = await ERC20Mock.new();
    erc20Addr = erc20.address;
    await erc20.mint(owner, new BN("1000000000000000000000000"));

    erc20ReturnFalse = await ERC20ReturnFalseMock.new();
    erc20ReturnFalseAddr = erc20ReturnFalse.address;
    await erc20ReturnFalse.mint(owner, new BN("1000000000000000000000000"));
  });

  describe("ETH Transactions", function () {
    it("Transfers ETH to the given address", async function () {
      const txAmount = new BN(web3.utils.toWei("5", "ether"));
      const initialBalance = new BN(await web3.eth.getBalance(addr1));

      const batch = {
        txns: [{ recipient: addr1, amount: txAmount.toString() }],
      };

      await distributor.distributeEther(batch, {
        from: owner,
        value: txAmount,
      });

      const finalBalance = new BN(await web3.eth.getBalance(addr1));
      expect(finalBalance.sub(initialBalance)).to.be.bignumber.equal(txAmount);
    });

    it("Transfers ETH to multiple given addresses", async function () {
      const batch = {
        txns: [
          { recipient: addr1, amount: web3.utils.toWei("0.2151", "ether") },
          {
            recipient: addr2,
            amount: web3.utils.toWei("2.040194018", "ether"),
          },
          { recipient: addr3, amount: web3.utils.toWei("0.0003184", "ether") },
          {
            recipient: addr4,
            amount: web3.utils.toWei("0.000000000001", "ether"),
          },
        ],
      };

      const totalAmount = web3.utils.toWei("5", "ether");

      await distributor.distributeEther(batch, {
        from: owner,
        value: totalAmount,
      });

      for (let i = 0; i < batch.txns.length; i++) {
        const balance = new BN(
          await web3.eth.getBalance(batch.txns[i].recipient)
        );
        expect(balance).to.be.bignumber.gt(
          new BN(web3.utils.toWei("10000", "ether")).add(
            new BN(batch.txns[i].amount)
          )
        );
      }
    });

    it("Sends back unused funds", async function () {
      const fundAmount = new BN(web3.utils.toWei("20", "ether"));
      const txAmount = new BN(web3.utils.toWei("5", "ether"));

      const initialBalance = new BN(await web3.eth.getBalance(owner));

      const batch = {
        txns: [{ recipient: addr1, amount: txAmount.toString() }],
      };

      const receipt = await distributor.distributeEther(batch, {
        from: owner,
        value: fundAmount,
      });
      const gasUsed = new BN(receipt.receipt.gasUsed);
      const tx = await web3.eth.getTransaction(receipt.tx);
      const gasPrice = new BN(tx.gasPrice);
      const gasCost = gasUsed.mul(gasPrice);

      const finalBalance = new BN(await web3.eth.getBalance(owner));

      expect(finalBalance).to.be.bignumber.closeTo(
        initialBalance.sub(txAmount).sub(gasCost),
        new BN(web3.utils.toWei("0.001", "ether"))
      );
    });

    it("Reverts if funds are sent to a non-payable address", async function () {
      const txAmount = new BN(web3.utils.toWei("5", "ether"));

      const batch = {
        txns: [{ recipient: erc20Addr, amount: txAmount.toString() }],
      };

      await expectRevert(
        distributor.distributeEther(batch, { from: owner, value: txAmount }),
        "EtherTransferFail"
      );
    });
  });

  describe("ERC20 Transactions", function () {
    it("Transfers tokens to multiple recipients", async function () {
      const batch = {
        txns: [
          { recipient: addr1, amount: "1000" },
          { recipient: addr2, amount: "2000" },
        ],
      };

      await erc20.approve(distributorAddr, "3000", { from: owner });
      await distributor.distributeToken(erc20Addr, batch, { from: owner });

      expect(await erc20.balanceOf(addr1)).to.be.bignumber.equal(
        new BN("1000")
      );
      expect(await erc20.balanceOf(addr2)).to.be.bignumber.equal(
        new BN("2000")
      );
    });

    it("Reverts if not enough tokens are approved", async function () {
      const batch = {
        txns: [
          { recipient: addr1, amount: "1000" },
          { recipient: addr2, amount: "2000" },
        ],
      };

      await erc20.approve(distributorAddr, "1500", { from: owner });

      await expectRevert(
        distributor.distributeToken(erc20Addr, batch, { from: owner }),
        "ERC20: insufficient allowance"
      );
    });

    it("Works with tokens that return false instead of reverting", async function () {
      const batch = {
        txns: [
          { recipient: addr1, amount: "1000" },
          { recipient: addr2, amount: "2000" },
        ],
      };

      await erc20ReturnFalse.approve(distributorAddr, "3000", { from: owner });
      await distributor.distributeToken(erc20ReturnFalseAddr, batch, {
        from: owner,
      });
    });
  });

  describe("Mass Transaction Tests", function () {
    it("Transfers ETH to a large number of addresses", async function () {
      const transactionCount = 100; // Reduced from 500 for faster tests
      const accounts = Array.from({ length: transactionCount }, () =>
        web3.eth.accounts.create()
      );

      const batch = {
        txns: accounts.map((account) => ({
          recipient: account.address,
          amount: web3.utils.toWei("0.00001", "ether"),
        })),
      };

      const totalAmount = web3.utils.toWei("0.001", "ether");
      await distributor.distributeEther(batch, {
        from: owner,
        value: totalAmount,
      });
    });

    it("Transfers ERC20 to a large number of addresses", async function () {
      const transactionCount = 100;
      const accounts = Array.from({ length: transactionCount }, () =>
        web3.eth.accounts.create()
      );

      const batch = {
        txns: accounts.map((account) => ({
          recipient: account.address,
          amount: "1",
        })),
      };

      await erc20.approve(distributorAddr, transactionCount.toString(), {
        from: owner,
      });
      await distributor.distributeToken(erc20Addr, batch, { from: owner });
    });
  });
});
