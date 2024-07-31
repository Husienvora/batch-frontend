// 2_deploy_contracts.js

const ERC20ReturnFalseMock = artifacts.require("ERC20ReturnFalseMock");

module.exports = async function (deployer, network, accounts) {
  // Deploy the ERC20ReturnFalseMock contract
  await deployer.deploy(ERC20ReturnFalseMock);
  const erc20ReturnFalseMock = await ERC20ReturnFalseMock.deployed();

  // Optionally mint tokens
  const recipient = accounts[0]; // Address to receive the minted tokens
  const amount = web3.utils.toWei("1000", "ether"); // Amount to mint (adjust as needed)

  // Call the mint function
  await erc20ReturnFalseMock.mint(recipient, amount);

  console.log(`Minted ${amount} tokens to ${recipient}`);
};
