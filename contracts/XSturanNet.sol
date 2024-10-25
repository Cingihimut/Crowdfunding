// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract XSturanNet is ERC20, ERC20Permit, ERC20Votes, Ownable {
    constructor(uint256 initialSupply, address initialOwner) Ownable(initialOwner) ERC20("XSturanNet", "XTR") ERC20Permit("MyToken") {
        _mint(msg.sender, initialSupply);
    }
    // The following functions are overrides required by Solidity.

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }

    function delegate(address to) public override {
        require(to != msg.sender, "Self-delegation is disallowed");
        _delegate(msg.sender, to);
    }
}
