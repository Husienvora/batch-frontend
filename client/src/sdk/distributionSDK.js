// src/sdk/DistributionSDK.js

import Web3 from "web3";
import ERC20ABI from "./ERC20Mock.json";
import BatchDistributor from "./BatchDistributor.json";
import ContractAdresses from "./ContractAddress.json";

class DistributionSDK {
  constructor(web3) {
    this.web3 = web3;
    this.contract = null;
  }

  async init() {
    const networkID = await this.web3.eth.net.getId();
    const { abi } = BatchDistributor;
    const address = ContractAdresses[networkID];
    this.contract = new this.web3.eth.Contract(abi, address);
  }

  async executeEthTransfers(recipients, amounts) {
    if (recipients.length !== amounts.length) {
      throw new Error(
        "Recipients and amounts arrays must have the same length"
      );
    }
    console.log(recipients);
    const batch = {
      txns: recipients.map((recipient, index) => ({
        recipient: recipient,
        amount: this.web3.utils.toWei(amounts[index].toString(), "ether"),
      })),
    };

    const totalAmount = amounts.reduce(
      (sum, amount) => sum + parseFloat(amount),
      0
    );
    const totalAmountWei = this.web3.utils.toWei(
      totalAmount.toString(),
      "ether"
    );

    try {
      const accounts = await this.web3.eth.getAccounts();
      const sender = accounts[0];

      const gasEstimate = await this.contract.methods
        .distributeEther(batch)
        .estimateGas({
          from: sender,
          value: totalAmountWei,
        });

      const result = await this.contract.methods.distributeEther(batch).send({
        from: sender,
        value: totalAmountWei,
        gas: Math.round(gasEstimate * 1.2),
      });

      console.log("Transaction successful:", result.transactionHash);
      return result;
    } catch (error) {
      console.error("Error executing ETH transfers:", error);
      throw error;
    }
  }

  async executeERC20Transfers(tokenAddress, recipients, amounts) {
    if (recipients.length !== amounts.length) {
      throw new Error(
        "Recipients and amounts arrays must have the same length"
      );
    }

    const tokenContract = new this.web3.eth.Contract(
      ERC20ABI.abi,
      tokenAddress
    );

    const batch = {
      txns: recipients.map((recipient, index) => ({
        recipient: recipient,
        amount: this.web3.utils.toWei(amounts[index].toString(), "ether"),
      })),
    };

    const totalAmount = amounts.reduce(
      (sum, amount) => sum + parseFloat(amount),
      0
    );
    const totalAmountWei = this.web3.utils.toWei(
      totalAmount.toString(),
      "ether"
    );

    try {
      const accounts = await this.web3.eth.getAccounts();
      const sender = accounts[0];

      const currentAllowance = await tokenContract.methods
        .allowance(sender, this.contract.options.address)
        .call();

      if (
        this.web3.utils
          .toBN(currentAllowance)
          .lt(this.web3.utils.toBN(totalAmountWei))
      ) {
        console.log("Setting allowance...");
        await tokenContract.methods
          .approve(this.contract.options.address, totalAmountWei)
          .send({ from: sender });
        console.log("Allowance set successfully");
      }

      const gasEstimate = await this.contract.methods
        .distributeToken(tokenAddress, batch)
        .estimateGas({
          from: sender,
        });

      const result = await this.contract.methods
        .distributeToken(tokenAddress, batch)
        .send({
          from: sender,
          gas: Math.round(gasEstimate * 1.2),
        });

      console.log("Transaction successful:", result.transactionHash);
      return result;
    } catch (error) {
      console.error("Error executing ERC20 transfers:", error);
      throw error;
    }
  }
}

export default DistributionSDK;
