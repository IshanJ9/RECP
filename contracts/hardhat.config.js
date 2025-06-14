require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
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
    sepolia:{
        url: process.env.AlCHEMY_API_KEY,
        accounts: [process.env.PRIVATE_KEY],
      }
    
  },
};