// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./Score.sol";

struct Bet {
    address bettor;
    Score score;
    uint256 value;
    // if zero, result not defined yet.
    // if one, the bet did not match he final score (loser bet)
    // if two, the bet match the final score and WON (winner bet)
    // if three, none bet match the final score (tied bet)
    // if four, the bet match the final score, WON and was already paid
    uint8 result;
    //Prize after game finalized
    uint256 prize;
}

/**
    uint8 public immutable PAID = 4;
    uint8 public immutable TIED = 3;
    uint8 public immutable WINNER = 2;
    uint8 public immutable LOSER = 1;
    uint8 public immutable NO_RESULT = 0;
*/
