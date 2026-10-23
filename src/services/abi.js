/**
 * Standard ABI Helpers and Calldata Encoders
 * Generates valid standard EVM calldata for ERC-20 transfer/approve and TrustDonate calls.
 */
import { padTo32Bytes, stripHexPrefix, toBaseUnits } from "./utils/tokenMath.js";

// Standard ERC20 4-byte function selectors
export const ERC20_SELECTORS = {
  // transfer(address to, uint256 value) -> 0xa9059cbb
  transfer: "0xa9059cbb",
  // approve(address spender, uint256 value) -> 0x095ea7b3
  approve: "0x095ea7b3",
  // balanceOf(address owner) -> 0x70a08231
  balanceOf: "0x70a08231",
  // allowance(address owner, address spender) -> 0xdd62ed3e
  allowance: "0xdd62ed3e",
};

/**
 * Encodes ERC20 transfer(address to, uint256 amount)
 * @param {string} recipientAddress
 * @param {string|BigInt} amountInBaseUnits
 * @returns {string} hex calldata
 */
export function encodeErc20Transfer(recipientAddress, amountInBaseUnits) {
  const cleanAddr = padTo32Bytes(stripHexPrefix(recipientAddress).toLowerCase());
  const hexAmount = BigInt(amountInBaseUnits).toString(16);
  const paddedAmount = padTo32Bytes(hexAmount);
  return `${ERC20_SELECTORS.transfer}${cleanAddr}${paddedAmount}`;
}

/**
 * Encodes ERC20 approve(address spender, uint256 amount)
 * @param {string} spenderAddress
 * @param {string|BigInt} amountInBaseUnits
 * @returns {string} hex calldata
 */
export function encodeErc20Approve(spenderAddress, amountInBaseUnits) {
  const cleanAddr = padTo32Bytes(stripHexPrefix(spenderAddress).toLowerCase());
  const hexAmount = BigInt(amountInBaseUnits).toString(16);
  const paddedAmount = padTo32Bytes(hexAmount);
  return `${ERC20_SELECTORS.approve}${cleanAddr}${paddedAmount}`;
}

/**
 * Encodes ERC20 balanceOf(address account)
 * @param {string} accountAddress
 * @returns {string} hex calldata
 */
export function encodeErc20BalanceOf(accountAddress) {
  const cleanAddr = padTo32Bytes(stripHexPrefix(accountAddress).toLowerCase());
  return `${ERC20_SELECTORS.balanceOf}${cleanAddr}`;
}
