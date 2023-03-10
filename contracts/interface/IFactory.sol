// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

interface IFactory {
  function treasury() external view returns (address);

  function treasuryFee() external view returns (uint);

  function partnerFee() external view returns (uint);

  function admin() external view returns (address);

  function partnerSetter() external view returns (address);

  function isPair(address pair) external view returns (bool);

  function getInitializable() external view returns (address, address, bool);

  function isPaused() external view returns (bool);

  function getFees(bool _stable) external view returns (uint);

  function pairCodeHash() external pure returns (bytes32);

  function getPair(address tokenA, address token, bool stable) external view returns (address);

  function createPair(address tokenA, address tokenB, bool stable) external returns (address pair);
}
