const HDWalletProvider = require("@truffle/hdwallet-provider");

module.exports = {
  contracts_build_directory: "./public/contracts",
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*",
    },
  },

  compilers: {
    solc: {
      version: "0.8.26",
      settings: {
        optimizer: {
          enabled: true,
          runs: 999_999,
        },
        evmVersion: "paris", // Prevent using the `PUSH0` and `cancun` opcodes
      },
    },
  },
};
