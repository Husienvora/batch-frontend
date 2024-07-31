const BatchDistributor = artifacts.require("BatchDistributor");

module.exports = function (deployer) {
  deployer.deploy(BatchDistributor);
};
