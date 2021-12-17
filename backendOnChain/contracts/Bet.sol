// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./Score.sol";

contract Bet {
    address payable private _gambler;
    Score private _score;

    constructor(address payable gambler_, Score memory score_) {
        _gambler = gambler_;
        _score = score_;
    }
}
