// src/components/ContractBtns.jsx

import React, { useState } from "react";
import useEth from "../../contexts/EthContext/useEth";
import {
  executeEthTransfers,
  executeERC20Transfers,
} from "../../sdk/distributionSDK";
import "./ContractBtns.css";

function ContractBtns() {
  const {
    state: { contract, accounts, web3, artifact },
  } = useEth();

  const [transactionType, setTransactionType] = useState("eth");
  const [transactions, setTransactions] = useState([
    { recipient: "", amount: "" },
  ]);
  const [tokenAddress, setTokenAddress] = useState("");

  const handleTypeChange = (e) => {
    setTransactionType(e.target.value);
  };

  const handleTransactionChange = (index, field, value) => {
    const newTransactions = [...transactions];
    newTransactions[index][field] = value;
    setTransactions(newTransactions);
  };

  const addTransaction = () => {
    setTransactions([...transactions, { recipient: "", amount: "" }]);
  };

  const removeTransaction = (index) => {
    const newTransactions = transactions.filter((_, i) => i !== index);
    setTransactions(newTransactions);
  };

  const handleDistribute = async () => {
    const recipients = transactions.map((t) => t.recipient);
    const amounts = transactions.map((t) => t.amount);

    try {
      if (transactionType === "eth") {
        await executeEthTransfers(web3, contract, recipients, amounts);
      } else {
        await executeERC20Transfers(
          web3,
          contract,
          artifact,
          tokenAddress,
          recipients,
          amounts
        );
      }
      alert("Distribution successful!");
    } catch (error) {
      console.error("Distribution error:", error);
      alert("Distribution failed. Check console for details.");
    }
  };

  return (
    <div className="transaction-form">
      <select value={transactionType} onChange={handleTypeChange}>
        <option value="eth">ETH</option>
        <option value="erc20">ERC20</option>
      </select>

      {transactionType === "erc20" && (
        <input
          type="text"
          placeholder="Token Address"
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value)}
        />
      )}

      {transactions.map((transaction, index) => (
        <div key={index} className="transaction-row">
          <input
            type="text"
            placeholder="Recipient Address"
            value={transaction.recipient}
            onChange={(e) =>
              handleTransactionChange(index, "recipient", e.target.value)
            }
          />
          <input
            type="number"
            placeholder="Amount"
            value={transaction.amount}
            onChange={(e) =>
              handleTransactionChange(index, "amount", e.target.value)
            }
          />
          <button onClick={() => removeTransaction(index)}>Remove</button>
        </div>
      ))}

      <button onClick={addTransaction}>Add Transaction</button>
      <button onClick={handleDistribute}>Distribute</button>
    </div>
  );
}

export default ContractBtns;
