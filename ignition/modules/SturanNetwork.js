const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { ethers } = require("hardhat");

module.exports = buildModule("SturanNetwork", (m) => {
  const XSturanNet = "0xeba6454f9c85004Ec39F9F91Cf1E24f7C094b226";
  const initialOwner = "0x0caDDE63e1A3F92d6E754eFb74288810DABFC150";
  const sturanNetwork = m.contract("SturanNetwork", [XSturanNet, initialOwner]);
  return { sturanNetwork };
});