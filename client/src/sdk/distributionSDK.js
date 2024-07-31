// src/sdk/distributionSDK.js

import Web3 from "web3";
import ERC20ABI from "../../../truffle/public/contracts/ERC20Mock.json";

export const executeEthTransfers = async (
  web3,
  contract,
  recipients,
  amounts
) => {
  if (recipients.length !== amounts.length) {
    throw new Error("Recipients and amounts arrays must have the same length");
  }

  // Prepare the batch object
  const batch = {
    txns: recipients.map((recipient, index) => ({
      recipient: recipient,
      amount: web3.utils.toWei(amounts[index].toString(), "ether"), // Convert to Wei
    })),
  };

  // Calculate total amount to send
  const totalAmount = amounts.reduce(
    (sum, amount) => sum + parseFloat(amount),
    0
  );
  const totalAmountWei = web3.utils.toWei(totalAmount.toString(), "ether");

  try {
    // Get the current account
    const accounts = await web3.eth.getAccounts();
    const sender = accounts[0];

    // Estimate gas
    const gasEstimate = await contract.methods
      .distributeEther(batch)
      .estimateGas({
        from: sender,
        value: totalAmountWei,
      });

    // Execute the transaction
    const result = await contract.methods.distributeEther(batch).send({
      from: sender,
      value: totalAmountWei,
      gas: Math.round(gasEstimate * 1.2), // Add 20% buffer to gas estimate
    });

    console.log("Transaction successful:", result.transactionHash);
    return result;
  } catch (error) {
    console.error("Error executing ETH transfers:", error);
    throw error;
  }
};

export const executeERC20Transfers = async (
  web3,
  contract,
  artifact,
  tokenAddress,
  recipients,
  amounts
) => {
  if (recipients.length !== amounts.length) {
    throw new Error("Recipients and amounts arrays must have the same length");
  }

  // Initialize ERC20 token contract
  const tokenContract = new web3.eth.Contract(ERC20ABI.abi, tokenAddress);

  // Prepare the batch object
  const batch = {
    txns: recipients.map((recipient, index) => ({
      recipient: recipient,
      amount: web3.utils.toWei(amounts[index].toString(), "ether"), // Assuming 18 decimals, adjust if different
    })),
  };

  // Calculate total amount to send
  const totalAmount = amounts.reduce(
    (sum, amount) => sum + parseFloat(amount),
    0
  );
  const totalAmountWei = web3.utils.toWei(totalAmount.toString(), "ether");
  const networkID = await web3.eth.net.getId();
  let batchDistributorAddress = artifact.networks[networkID].address;
  try {
    // Get the current account
    const accounts = await web3.eth.getAccounts();
    const sender = accounts[0];

    // Check and set allowance
    const currentAllowance = await tokenContract.methods
      .allowance(sender, batchDistributorAddress)
      .call();
    if (web3.utils.toBN(currentAllowance).lt(web3.utils.toBN(totalAmountWei))) {
      console.log("Setting allowance...");
      await tokenContract.methods
        .approve(batchDistributorAddress, totalAmountWei)
        .send({ from: sender });
      console.log("Allowance set successfully");
    }

    // Estimate gas
    const gasEstimate = await contract.methods
      .distributeToken(tokenAddress, batch)
      .estimateGas({
        from: sender,
      });

    // Execute the transaction
    const result = await contract.methods
      .distributeToken(tokenAddress, batch)
      .send({
        from: sender,
        gas: Math.round(gasEstimate * 1.2), // Add 20% buffer to gas estimate
      });

    console.log("Transaction successful:", result.transactionHash);
    return result;
  } catch (error) {
    console.error("Error executing ERC20 transfers:", error);
    throw error;
  }
};
