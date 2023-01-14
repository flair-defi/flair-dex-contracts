// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import "../../lib/Math.sol";
import "../../lib/SafeERC20.sol";
import "../../interface/IUnderlying.sol";
import "../../interface/IVoter.sol";
import "../../interface/IVe.sol";
import "../../interface/IVeDist.sol";
import "../../interface/IMinter.sol";
import "../../interface/IERC20.sol";
import "../../interface/IController.sol";

/// @title Codifies the minting rules as per ve(3,3),
///        abstracted from the token to support any token that allows minting
contract FldxMinter is IMinter {
  using SafeERC20 for IERC20;

  /// @dev Allows minting once per week (reset every Thursday 00:00 UTC)
  uint internal constant _WEEK = 86400 * 7;
  uint internal constant _LOCK_PERIOD = 86400 * 7 * 52 * 4;
  uint internal constant PRECISION = 100;

  /// @dev Decrease base weekly emission by 2%
  uint internal constant _WEEKLY_EMISSION_DECREASE = 98;

  /// @dev Weekly emission threshold for the end game. 2% of circulation supply.
  uint internal constant _TAIL_EMISSION = 2;

  /// @dev Treasury Emission.
  uint internal constant _TREASURY_EMISSION = 3;

  /// @dev NFT Stakers Emission.
  uint internal constant _NFT_STAKERS_EMISSION = 3;

  /// @dev The core parameter for determinate the whole emission dynamic.
  ///       Will be decreased every week.
  uint internal constant _START_BASE_WEEKLY_EMISSION = 10_000_000e18;


  IUnderlying public immutable token;
  IVe public immutable ve;
  address public immutable controller;
  uint public baseWeeklyEmission = _START_BASE_WEEKLY_EMISSION;
  uint public activePeriod;

  address public treasury;
  address public pendingTreasury;
  address public nftStakingContract;

  address internal initializer;
  bool public initialDistributionFinished;

  event Mint(
    address indexed sender,
    uint weekly,
    uint growth,
    uint circulatingSupply,
    uint circulatingEmission
  );

  constructor(
    address ve_, // the ve(3,3) system that will be locked into
    address controller_, // controller with veDist and voter addresses
    uint warmingUpPeriod // 2 by default
  ) {
    initializer = msg.sender;
    token = IUnderlying(IVe(ve_).token());
    ve = IVe(ve_);
    controller = controller_;
    treasury = msg.sender;
    nftStakingContract = msg.sender;
    activePeriod = (block.timestamp + (warmingUpPeriod * _WEEK)) / _WEEK * _WEEK;
  }

  /// @dev Mint initial supply to holders and lock it to ve token.
  function premintAndLock(
    address[] memory claimants,
    uint[] memory amounts,
    uint totalAmount
  ) external {
    require(initializer == msg.sender, "Not initializer");
    require(initialDistributionFinished == false, "Initial Distribution Finished");
    token.mint(address(this), totalAmount);
    token.approve(address(ve), type(uint).max);
    uint sum;
    for (uint i = 0; i < claimants.length; i++) {
      ve.createLockFor(amounts[i], _LOCK_PERIOD, claimants[i]);
      sum += amounts[i];
    }
    require(sum == totalAmount, "Wrong totalAmount");
    activePeriod = (block.timestamp + _WEEK) / _WEEK * _WEEK;
  }

  /// @dev Mint initial supply to holders without lock.
  function premint(
    address[] memory claimants,
    uint[] memory amounts,
    uint totalAmount) external {
    require(initializer == msg.sender, "Not initializer");
    require(initialDistributionFinished == false, "Initial Distribution Finished");
    uint sum;
    for (uint i = 0; i < claimants.length; i++) {
      token.mint(claimants[i], amounts[i]);
      sum += amounts[i];
    }
    require(sum == totalAmount, "Wrong totalAmount");
    activePeriod = (block.timestamp + _WEEK) / _WEEK * _WEEK;
  }

  /// @dev Disable future minting
  function markInitialDistributionAsCompleted() external {
    require(initializer == msg.sender, "Not initializer");
    initialDistributionFinished = true;
  }

  function setTreasury(address _treasury) external {
    require(msg.sender == treasury, "Not treasury");
    pendingTreasury = _treasury;
  }

  function acceptTreasury() external {
    require(msg.sender == pendingTreasury, "Not pending treasury");
    treasury = pendingTreasury;
  }

  function setNftStakingContract(address _nftStakingContract) external {
    require(msg.sender == initializer, "Not treasury");
    nftStakingContract = _nftStakingContract;
  }

  function _veDist() internal view returns (IVeDist) {
    return IVeDist(IController(controller).veDist());
  }

  function _voter() internal view returns (IVoter) {
    return IVoter(IController(controller).voter());
  }

  /// @dev Calculate circulating supply as total token supply - locked supply - veDist balance - minter balance
  function circulatingSupply() external view returns (uint) {
    return _circulatingSupply();
  }

  function _circulatingSupply() internal view returns (uint) {
    return token.totalSupply() - IUnderlying(address(ve)).totalSupply()
    // exclude veDist token balance from circulation - users unable to claim them without lock
    // late claim will lead to wrong circulation supply calculation
    - token.balanceOf(address(_veDist()))
    // exclude balance on minter, it is obviously locked
    - token.balanceOf(address(this));
  }

  /// @dev Weekly emission takes the max of calculated (aka target) emission versus circulating tail end emission
  function weeklyEmission() external view returns (uint) {
    return _weeklyEmission();
  }

  function _weeklyEmission() internal view returns (uint) {
    return Math.max(baseWeeklyEmission, _circulatingEmission());
  }

  /// @dev Calculates tail end (infinity) emissions as 0.2% of total supply
  function circulatingEmission() external view returns (uint) {
    return _circulatingEmission();
  }

  function _circulatingEmission() internal view returns (uint) {
    return _circulatingSupply() * _TAIL_EMISSION / PRECISION;
  }

  /// @dev Calculate inflation and adjust ve balances accordingly
  function calculateGrowth(uint _minted) external view returns (uint) {
    return _calculateGrowth(_minted);
  }

  /// @dev calculate inflation and adjust ve balances accordingly
  function _calculateGrowth(uint _minted) internal view returns (uint) {
    uint _veTotal = IUnderlying(address(ve)).totalSupply();
    uint _fldxTotal = token.totalSupply();
    return
    (((((_minted * _veTotal) / _fldxTotal) * _veTotal) / _fldxTotal) *
    _veTotal) /
    _fldxTotal /
    2;
  }

  /// @dev Update period can only be called once per cycle (1 week)
  function updatePeriod() external override returns (uint) {
    uint _period = activePeriod;
    // only trigger if new week
    if (block.timestamp >= _period + _WEEK && initialDistributionFinished) {
      _period = block.timestamp / _WEEK * _WEEK;
      activePeriod = _period;
      uint _weekly = _weeklyEmission();
      // slightly decrease weekly emission
      baseWeeklyEmission = baseWeeklyEmission
      * _WEEKLY_EMISSION_DECREASE
      / PRECISION;

      uint _growth = _calculateGrowth(_weekly);
      uint _treasury = (_weekly + _growth) * _TREASURY_EMISSION / PRECISION;
      uint _nftstakers = (_weekly + _growth) * _NFT_STAKERS_EMISSION / PRECISION;
      uint _required = _growth + _weekly + _treasury + _nftstakers;
      uint _balanceOf = token.balanceOf(address(this));
      if (_balanceOf < _required) {
        token.mint(address(this), _required - _balanceOf);
      }

      IERC20(address(token)).safeTransfer(address(_veDist()), _growth);
      // checkpoint token balance that was just minted in veDist
      _veDist().checkpointToken();
      // checkpoint supply
      _veDist().checkpointTotalSupply();

      token.approve(address(_voter()), _weekly);
      _voter().notifyRewardAmount(_weekly);

      IERC20(address(token)).safeTransfer(treasury, _treasury);
      IERC20(address(token)).safeTransfer(nftStakingContract, _nftstakers);

      emit Mint(msg.sender, _weekly, _growth, _circulatingSupply(), _circulatingEmission());
    }
    return _period;
  }

}
