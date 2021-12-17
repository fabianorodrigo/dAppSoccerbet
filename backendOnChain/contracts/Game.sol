// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./structs/Score.sol";
import "./structs/Bet.sol";
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
    //When TRUE, the game is already finished
    bool private _finalized;

    constructor(
        string memory house_,
        string memory visitor_,
        uint256 datetimeGame_,
        address betTokenContractAddress_
    ) Ownable() {
        _houseTeam = house_;
        _visitorTeam = visitor_;
        _datetimeGame = datetimeGame_;
        _open = false;
        _finalized = false;
        _betTokenContract = BetToken(payable(betTokenContractAddress_));
    }

    /**
     * Opens a game for betting (sets the _open to TRUE)
     */
    function openForBetting() public onlyOwner {
        require(_open == false, "The game is not closed");
        _open = true;
    }

    /**
     * Closes a game for betting (sets the _open to FALSE)
     */
    function closeForBetting() public onlyOwner {
        require(_open, "The game is not open");
        _open = false;
    }

    /**
     * Finishes the game registering the final score
     * @param finalScore_ Data of the final score of the match
     */
    function finishGame(Score memory finalScore_) public onlyOwner {
        require(_finalized == false, "The game has been already finalized");
        require(
            _open == false,
            "The game is still open for bettings, close it first"
        );
        // register the final score and finishes the game
        _finalScore = finalScore_;
        _finalized = true;
    }

    /**
     * Alllows edit the score of a finished game just in case something was wrong
     * @param finalScore_ Data of the final score of the match
     */
    function editFinishedGameScore(Score memory finalScore_) public onlyOwner {
        require(
            _finalized,
            "The game hasn't been finalized yet. Call finishGame function"
        );
        // register the final score and finishes the game
        _finalScore = finalScore_;
    }

    /**
     * Returns TRUE if the game was already finalized
     */
    function getFinalized() public view returns (bool) {
        return _finalized;
    }

    function destroyContract() public onlyOwner {
        selfdestruct(payable(this.owner()));
    }
}
