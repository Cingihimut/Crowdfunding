const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { ethers } = require("hardhat");

module.exports = buildModule("XSturanNet", (m) => {
  const initialOwner = "0x0caDDE63e1A3F92d6E754eFb74288810DABFC150"
  const initialSupply = ethers.parseUnits("100000000", 18)
  const xSturanet = m.contract("XSturanNet", [initialSupply, initialOwner]);
  return { xSturanet };
});