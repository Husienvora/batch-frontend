// src/sdk/DistributionSDK.js

import ERC20ABI from "./ERC20Mock.json";
import BatchDistributor from "./BatchDistributor.json";
import ContractAddresses from "./ContractAddress.json";

/**
 * DistributionSDK class for handling batch transactions of ETH and ERC20 tokens.
 */
class DistributionSDK {
  /**
   * Create a new DistributionSDK instance.
   * @param web3 - The Web3 instance to use.
   */
  constructor(web3) {
    this.web3 = web3;
    this.contract = null;
    this.maxBatchSize = 100; // Default max batch size
  }

  /**
   * Initialize the SDK with the batching contract.
   * @param {string} [customAddress] - Optional custom contract address.
   */
  async init(customAddress = null) {
    const networkID = await this.web3.eth.net.getId();
    const { abi } = BatchDistributor;
    const address = customAddress || ContractAddresses[networkID];
    if (!address) {
      throw new Error(`No contract address found for network ID: ${networkID}`);
    }
    this.contract = new this.web3.eth.Contract(abi, address);
  }

  /**
   * Set the maximum batch size for transactions.
   * @param {number} size - The maximum number of transactions in a batch.
   */
  setMaxBatchSize(size) {
    if (typeof size !== "number" || size <= 0) {
      throw new Error("Invalid batch size");
    }
    this.maxBatchSize = size;
  }

  /**
   * Execute ETH transfers in batches.
   * @param {string[]} recipients - Array of recipient addresses.
   * @param {string[]} amounts - Array of amounts in ETH.
   * @param {Object} [options] - Optional parameters for the transaction.
   * @param {string} [options.gasPrice] - Custom gas price in wei.
   * @param {number} [options.gasLimit] - Custom gas limit.
   */
  async executeEthTransfers(recipients, amounts, options = {}) {
    this._validateInputs(recipients, amounts);

    const batch = {
      txns: recipients.map((recipient, index) => ({
        recipient,
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
        .estimateGas({ from: sender, value: totalAmountWei });

      const gasPrice = options.gasPrice || (await this.web3.eth.getGasPrice());
      const gasLimit = options.gasLimit || Math.round(gasEstimate * 1.2);

      const result = await this.contract.methods.distributeEther(batch).send({
        from: sender,
        value: totalAmountWei,
        gasPrice,
        gas: gasLimit,
      });

      console.log("Transaction successful:", result.transactionHash);
      return result;
    } catch (error) {
      console.error("Error executing ETH transfers:", error);
      throw error;
    }
  }

  /**
   * Execute ERC20 token transfers in batches.
   * @param {string} tokenAddress - The address of the ERC20 token contract.
   * @param {string[]} recipients - Array of recipient addresses.
   * @param {string[]} amounts - Array of amounts in token units.
   * @param {Object} [options] - Optional parameters for the transaction.
   * @param {string} [options.gasPrice] - Custom gas price in wei.
   * @param {number} [options.gasLimit] - Custom gas limit.
   * @param {number} [options.decimals] - Token decimals (default: 18).
   */
  async executeERC20Transfers(tokenAddress, recipients, amounts, options = {}) {
    this._validateInputs(recipients, amounts);

    const tokenContract = new this.web3.eth.Contract(
      ERC20ABI.abi,
      tokenAddress
    );
    // const decimals = options.decimals || 18;

    const batch = {
      txns: recipients.map((recipient, index) => ({
        recipient,
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

      await this._checkAndSetAllowance(tokenContract, sender, totalAmountWei);

      const gasEstimate = await this.contract.methods
        .distributeToken(tokenAddress, batch)
        .estimateGas({ from: sender });

      const gasPrice = options.gasPrice || (await this.web3.eth.getGasPrice());
      const gasLimit = options.gasLimit || Math.round(gasEstimate * 1.2);

      const result = await this.contract.methods
        .distributeToken(tokenAddress, batch)
        .send({
          from: sender,
          gasPrice,
          gas: gasLimit,
        });

      console.log("Transaction successful:", result.transactionHash);
      return result;
    } catch (error) {
      console.error("Error executing ERC20 transfers:", error);
      throw error;
    }
  }

  /**
   * Validate input arrays for batch transactions.
   * @private
   * @param {string[]} recipients - Array of recipient addresses.
   * @param {string[]} amounts - Array of amounts.
   */
  _validateInputs(recipients, amounts) {
    if (recipients.length !== amounts.length) {
      throw new Error(
        "Recipients and amounts arrays must have the same length"
      );
    }
    if (recipients.length > this.maxBatchSize) {
      throw new Error(
        `Batch size exceeds maximum allowed (${this.maxBatchSize})`
      );
    }
    if (!recipients.every((addr) => this.web3.utils.isAddress(addr))) {
      throw new Error("Invalid recipient address detected");
    }
    if (
      !amounts.every(
        (amount) => !isNaN(parseFloat(amount)) && parseFloat(amount) > 0
      )
    ) {
      throw new Error("Invalid amount detected");
    }
  }

  /**
   * Check and set allowance for ERC20 token transfers.
   * @private
   * @param {Object} tokenContract - The ERC20 token contract instance.
   * @param {string} sender - The sender's address.
   * @param {string} totalAmountWei - The total amount in wei to approve.
   */
  async _checkAndSetAllowance(tokenContract, sender, totalAmountWei) {
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
  }
}

export default DistributionSDK;
