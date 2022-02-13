// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./Score.sol";

struct Bet {
    address bettor;
    Score score;
    uint256 value;
    // if zero, result not defined yet.
    // if one, the bet did not match he final score
    // if two, the bet match the final score and WON
    uint8 result;
}
