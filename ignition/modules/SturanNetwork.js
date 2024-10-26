const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { ethers } = require("hardhat");

module.exports = buildModule("SturanNetwork", (m) => {
  const XSturanNet = "0x8B0cc85Ece3362DCe3413F127baEc1EF5BcAc8c7";
  const initialOwner = "0x0caDDE63e1A3F92d6E754eFb74288810DABFC150";
  const sturanNetwork = m.contract("SturanNetwork", [XSturanNet, initialOwner]);
  return { sturanNetwork };
});