// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./Score.sol";

struct Bet {
    address payable gambler;
    Score score;
}
