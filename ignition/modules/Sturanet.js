const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { ethers } = require("hardhat");

module.exports = buildModule("MockToken", (m) => {
  const initialOwner = "0x0caDDE63e1A3F92d6E754eFb74288810DABFC150"
  const initialSupply = ethers.parseUnits("100000000", 18)
  const mockToken = m.contract("MockToken", initialOwner, initialSupply);
  return { mockToken };
});