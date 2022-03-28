// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./Score.sol";
import "./Bet.sol";

struct GameDTO {
    address addressGame;
    string homeTeam;
    string visitorTeam;
    uint256 datetimeGame;
    bool open;
    bool finalized;
    Score finalScore;
    uint256 commission;
}
