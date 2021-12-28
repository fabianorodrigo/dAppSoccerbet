// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./Score.sol";

struct Bet {
    address bettor;
    Score score;
    uint256 value;
}
