// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import "../../interface/IFactory.sol";
import "./FldxPair.sol";

contract FldxFactory is IFactory {

  bool public override isPaused;
  address public pauser;
  address public pendingPauser;
  address public immutable override treasury;
  address public feeManager;
  address public pendingFeeManager;

  uint256 public stableFee;
  uint256 public volatileFee;

  /// @dev 0.4% max volatile swap fees
  uint internal constant MAX_VOLATILE_SWAP_FEE = 40;
  /// @dev 0.1% max stable swap fee
  uint internal constant MAX_STABLE_SWAP_FEE = 10;

  mapping(address => mapping(address => mapping(bool => address))) public override getPair;
  address[] public allPairs;
  /// @dev Simplified check if its a pair, given that `stable` flag might not be available in peripherals
  mapping(address => bool) public override isPair;

  address internal _temp0;
  address internal _temp1;
  bool internal _temp;

  event PairCreated(
    address indexed token0,
    address indexed token1,
    bool stable,
    address pair,
    uint allPairsLength
  );

  constructor(address _treasury) {
    pauser = msg.sender;
    feeManager = msg.sender;
    isPaused = false;
    treasury = _treasury;
    volatileFee = 20;
    stableFee = 4;
  }

  function allPairsLength() external view returns (uint) {
    return allPairs.length;
  }

  function setPauser(address _pauser) external {
    require(msg.sender == pauser, "FldxFactory: Not pauser");
    pendingPauser = _pauser;
  }

  function acceptPauser() external {
    require(msg.sender == pendingPauser, "FldxFactory: Not pending pauser");
    pauser = pendingPauser;
  }

  function setFeeManager(address _feeManager) external {
    require(msg.sender == feeManager, 'not fee manager');
    pendingFeeManager = _feeManager;
  }

  function acceptFeeManager() external {
    require(msg.sender == pendingFeeManager, 'not pending fee manager');
    feeManager = pendingFeeManager;
  }

  function setPause(bool _state) external {
    require(msg.sender == pauser, "FldxFactory: Not pauser");
    isPaused = _state;
  }

  function setFee(bool _stable, uint256 _fee) external {
    require(msg.sender == feeManager, 'not fee manager');
    require(_fee != 0, 'fee must be nonzero');

    if (_stable) {
      require(_fee <= MAX_STABLE_SWAP_FEE, 'fee too high');
      stableFee = _fee;
    } else {
      require(_fee <= MAX_VOLATILE_SWAP_FEE, 'fee too high');
      volatileFee = _fee;
    }
  }

  function getFees(bool _stable) external view returns (uint) {
    if (_stable) {
      return stableFee;
    } else {
      return volatileFee;
    }
  }

  function pairCodeHash() external pure override returns (bytes32) {
    return keccak256(type(FldxPair).creationCode);
  }

  function getInitializable() external view override returns (address, address, bool) {
    return (_temp0, _temp1, _temp);
  }

  function createPair(address tokenA, address tokenB, bool stable)
  external override returns (address pair) {
    require(tokenA != tokenB, 'FldxFactory: IDENTICAL_ADDRESSES');
    (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    require(token0 != address(0), 'FldxFactory: ZERO_ADDRESS');
    require(getPair[token0][token1][stable] == address(0), 'FldxFactory: PAIR_EXISTS');
    // notice salt includes stable as well, 3 parameters
    bytes32 salt = keccak256(abi.encodePacked(token0, token1, stable));
    (_temp0, _temp1, _temp) = (token0, token1, stable);
    pair = address(new FldxPair{salt : salt}());
    getPair[token0][token1][stable] = pair;
    // populate mapping in the reverse direction
    getPair[token1][token0][stable] = pair;
    allPairs.push(pair);
    isPair[pair] = true;
    emit PairCreated(token0, token1, stable, pair, allPairs.length);
  }
}
