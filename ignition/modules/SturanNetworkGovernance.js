const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { ethers } = require("hardhat");

module.exports = buildModule("SturanNetworkGovernor", (m) =>{
    const ercVotes = "0xeba6454f9c85004Ec39F9F91Cf1E24f7C094b226";
    const ercGov = "0xeba6454f9c85004Ec39F9F91Cf1E24f7C094b226";
    const sturanNetworkGovernor = m.contract("SturanNetworkGovernor", [ercVotes, ercGov]);
    return { sturanNetworkGovernor }
})