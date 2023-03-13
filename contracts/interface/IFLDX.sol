// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./IERC20.sol";

interface IFLDX is IERC20 {

    function claim(address to, uint256 amount) external returns (bool);
}