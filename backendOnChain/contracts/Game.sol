// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./Score.sol";
import "./Bet.sol";
import "./BetToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Game is Ownable {
    //BetToken contract
    BetToken private _betTokenContract;
    //When open, gamblers can bet
    bool private _open;
    string private _houseTeam;
    string private _visitorTeam;
    //datetime of the game in seconds
    uint256 private _datetimeGame;
    //bets
    Bet[] private _bets;
    //real final score
    Score private _finalScore;

    constructor(
        string memory house_,
        string memory visitor_,
        uint256 datetimeGame_,
        address betTokenContractAddress_
    ) {
        _houseTeam = house_;
        _visitorTeam = visitor_;
        _datetimeGame = datetimeGame_;
        _open = false;
        _betTokenContract = BetToken(payable(betTokenContractAddress_));
    }

    function openBetting() public onlyOwner {
        _open = true;
    }

    function closeBetting() public onlyOwner {
        _open = false;
    }

    function finishGame(Score memory finalScore_) public onlyOwner {
        _open = false;
        _finalScore = finalScore_;
    }
}
