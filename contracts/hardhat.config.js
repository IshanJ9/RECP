require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28", // or your contract version
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      // Avoid forking very old blocks
      // Don't set hardfork to "spuriousDragon"
      hardfork: "merge", // or "istanbul", "london", etc.
    },
  },
};