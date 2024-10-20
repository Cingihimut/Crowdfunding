require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

const infura_api_key = process.env.INFURA_API_KEY;
const private_key = process.env.PRIVATE_KEY;
const etherscan_api_key = process.env.ETHERSCAN_API_KEY;
const base_scan = process.env.BASESCAN_API_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "sepolia",
  networks: {
    hardhat: {
      accounts: {
        chainId: 31337,
        count: 10,
        accountsBalance: "10000000000000000000000"
      }
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${infura_api_key}`,
      accounts: [`${private_key}`],
    },
    'base-sepolia': {
      url: 'https://sepolia.base.org',
      accounts: [`${private_key}`],
      gasPrice: 1000000000,
    },
    gannache: {
      url: "HTTP://127.0.0.1:7545",
      accounts: ["0xd4d47dc9227fa5bf36a6157002e44b634798295123c7b634cbbd829871f9f0a4"],
    },
  },
  etherscan: {
    apiKey:{
      sepolia: etherscan_api_key,
      'base-sepolia': base_scan
    },
    customChains: [
      {
        network: "base-sepolia",
        chainId: 84532,
        urls: {
         apiURL: "https://api-sepolia.basescan.org/api",
         browserURL: "https://sepolia.basescan.org"
        }
      }
    ]
  },
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  sourcify: {
    enabled: true
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  },
  ignition: {
    initialowner: "0xe1654213b35D4Da60A37d52f9236848693a4911a"
  },
};