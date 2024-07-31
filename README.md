# DistributionSDK

[Video demo](https://www.loom.com/share/d21a953e170d4055b9fe2ffbe885b8c3?sid=858c6349-75dd-453f-b77d-172907d0626a)

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Running the Demo](#running-the-demo)
- [Usage](#usage)
  - [Initialization](#initialization)
  - [Executing ETH Transfers](#executing-eth-transfers)
  - [Executing ERC20 Transfers](#executing-erc20-transfers)
  - [Customizing Batch Size](#customizing-batch-size)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Contributing](#contributing)
- [License](#license)

## Introduction

DistributionSDK is a powerful and flexible JavaScript library designed to simplify batch transactions of ETH and ERC20 tokens on Ethereum-compatible networks. It seamlessly integrates with open-source batching contracts, providing an easy-to-use interface for developers to execute multiple transactions in a single operation, saving gas costs and improving efficiency.

GOTO the main [DistributionSDK.js](https://github.com/Husienvora/batch-frontend/blob/master/client/src/sdk/distributionSDK.js)

As for the Truffle project in the repo , used to deploy and write smart contracts. Have written tests for BatchDistributor.sol for both eth transfer and erc-20 transfer.

GOTO [Written tests](https://github.com/Husienvora/batch-frontend/blob/master/truffle/test/BatchDistributor.js)

## Features

- 🚀 Batch ETH and ERC20 token transfers
- ⚙️ Customizable gas pricing and limits
- 🔒 Built-in security checks and input validation
- 🌐 Support for custom contract addresses
- 📊 Flexible batch size configuration
- 📚 Comprehensive documentation and examples

## Installation

To install Demo:

```bash
git clone https://github.com/Husienvora/batch-frontend.git
```

## Running the Demo

To run the demo application, follow these steps:

1. Make sure you have

- [Ganache](https://trufflesuite.com/ganache/) installed and running on your local machine.
- [Metamask](https://chromewebstore.google.com/detail/nkbihfbeogaeaoehlefnkodbefgpgknn) browser extension installed because it is used as provider.

2. Open a terminal and navigate to the `truffle` directory:

   ```bash
   cd truffle
   ```

3. Install the necessary dependencies:

   ```bash
   npm install
   ```

4. Deploy the contracts to your local Ganache network:

   ```bash
   truffle migrate
   ```

   or

   ```bash
   truffle deploy
   ```

5. Now, navigate to the `client` directory:

   ```bash
   cd ../client
   ```

6. Install the client dependencies:

   ```bash
   npm install
   ```

7. Start the React application:
   ```bash
   npm start
   ```

The demo application should now be running and accessible in your web browser.

**Note:** The demo uses a mock ERC20 token (MCK) for testing ERC20 transfers. This token is deployed along with the other contracts when you run `truffle migrate`.

## Usage

### Initialization

The SDK is initialized in the `EthProvider` component located in the client folder. It's then made available through the `useEth` hook and utilized in the `ContractBtns.jsx` component.

```javascript
// In EthProvider.jsx
import DistributionSDK from "../../sdk/distributionSDK";

// ... other imports and code

const init = useCallback(async (artifact) => {
  if (artifact) {
    const web3 = new Web3(Web3.givenProvider || "ws://localhost:8545");
    // ... other initialization code

    const sdk = new DistributionSDK(web3);
    await sdk.init();

    dispatch({
      type: actions.init,
      data: { artifact, web3, accounts, networkID, contract, sdk },
    });
  }
}, []);

// ... rest of the EthProvider component
```

### Executing ETH Transfers

To execute batch ETH transfers:

```javascript
// In ContractBtns.jsx
import useEth from "../../contexts/EthContext/useEth";

function ContractBtns() {
  const {
    state: { sdk },
  } = useEth();

  const handleEthTransfer = async () => {
    const recipients = ["0x123...", "0x456...", "0x789..."];
    const amounts = ["0.1", "0.2", "0.3"]; // in ETH

    try {
      const result = await sdk.executeEthTransfers(recipients, amounts);
      console.log("Batch ETH transfer successful:", result.transactionHash);
    } catch (error) {
      console.error("Error in batch ETH transfer:", error);
    }
  };

  // ... rest of the component
}
```

### Executing ERC20 Transfers

To execute batch ERC20 token transfers:

```javascript
const handleERC20Transfer = async () => {
  const tokenAddress = "0xTokenContractAddress";
  const recipients = ["0x123...", "0x456...", "0x789..."];
  const amounts = ["100", "200", "300"]; // in token units

  try {
    const result = await sdk.executeERC20Transfers(
      tokenAddress,
      recipients,
      amounts
    );
    console.log("Batch ERC20 transfer successful:", result.transactionHash);
  } catch (error) {
    console.error("Error in batch ERC20 transfer:", error);
  }
};
```

### Customizing Batch Size

You can set a custom maximum batch size:

```javascript
sdk.setMaxBatchSize(50); // Set max batch size to 50 transactions
```
