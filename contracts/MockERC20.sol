// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @dev Mock token representing USDC or USDT on local testnet with configurable decimals and public minting.
 */
contract MockERC20 is ERC20 {
    uint8 private _customDecimals;

    constructor(
        string memory name,
        string memory symbol,
        uint8 customDecimals_
    ) ERC20(name, symbol) {
        _customDecimals = customDecimals_;
        _mint(msg.sender, 1_000_000 * 10 ** customDecimals_);
    }

    function decimals() public view virtual override returns (uint8) {
        return _customDecimals;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
