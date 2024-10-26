const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { ethers } = require("hardhat");

module.exports = buildModule("SturanNetworkGovernor", (m) =>{
    const ercVotes = "0x8B0cc85Ece3362DCe3413F127baEc1EF5BcAc8c7";
    const ercGov = "0x8B0cc85Ece3362DCe3413F127baEc1EF5BcAc8c7";
    const sturanNetworkGovernor = m.contract("SturanNetworkGovernor", [ercVotes, ercGov]);
    return { sturanNetworkGovernor }
})