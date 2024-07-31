// 2_deploy_contracts.js

const ERC20Mock = artifacts.require("ERC20Mock");

module.exports = async function (deployer, network, accounts) {
  // Deploy the ERC20Mock contract
  await deployer.deploy(ERC20Mock);
  const erc20Mock = await ERC20Mock.deployed();

  // Mint tokens
  const recipient = accounts[0]; // The address to receive the minted tokens
  const amount = web3.utils.toWei("1000", "ether"); // Amount to mint (adjust as necessary)

  // Call the mint function
  await erc20Mock.mint(recipient, amount);

  console.log(`Minted ${amount} tokens to ${recipient}`);
};
