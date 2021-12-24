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
    //When TRUE, the game is already finalized
    bool private _finalized;

    /**
     * Event triggered when a game is opened for betting
     */
    event GameOpened(
        address addressGame,
        string homeTeam,
        string visitorTeam,
        uint256 datetimeGame
    );
    /**
     * Event triggered when a game is closed for betting
     */
    event GameClosed(
        address addressGame,
        string homeTeam,
        string visitorTeam,
        uint256 datetimeGame
    );
    /**
     * Event triggered when a game is finalized
     */
    event GameFinalized(
        address addressGame,
        string homeTeam,
        string visitorTeam,
        uint256 datetimeGame,
        Score score
    );
    /**
     * Event triggered when a game has the final score updated
     */
    event GameFinalScoreUpdated(
        address addressGame,
        string homeTeam,
        string visitorTeam,
        uint256 datetimeGame,
        Score score
    );

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
        require(_finalized == false, "Game has been already finalized");
        _open = true;
        emit GameOpened(address(this), _houseTeam, _visitorTeam, _datetimeGame);
    }

    /**
     * Closes a game for betting (sets the _open to FALSE)
     */
    function closeForBetting() public onlyOwner {
        require(_open, "The game is not open");
        require(_finalized == false, "Game has been already finalized");
        _open = false;
        emit GameClosed(address(this), _houseTeam, _visitorTeam, _datetimeGame);
    }

    /**
     * Finalize the game registering the final score
     * @param finalScore_ Data of the final score of the match
     */
    function finalizeGame(Score memory finalScore_) public onlyOwner {
        require(_finalized == false, "The game has been already finalized");
        require(
            _open == false,
            "The game is still open for bettings, close it first"
        );
        // register the final score and finalizes the game
        _finalScore = finalScore_;
        _finalized = true;
        emit GameFinalized(
            address(this),
            _houseTeam,
            _visitorTeam,
            _datetimeGame,
            _finalScore
        );
    }

    /**
     * Alllows edit the score of a finalized game just in case something was wrong
     * @param finalScore_ Data of the final score of the match
     */
    function editFinalizedGameScore(Score memory finalScore_) public onlyOwner {
        require(
            _finalized,
            "The game hasn't been finalized yet. Call finalizeGame function"
        );
        // register the final score and finalizes the game
        _finalScore = finalScore_;
        emit GameFinalScoreUpdated(
            address(this),
            _houseTeam,
            _visitorTeam,
            _datetimeGame,
            _finalScore
        );
    }

    /**
     * Returns TRUE if the game is open for betting
     */
    function isOpen() public view returns (bool) {
        return _open;
    }

    /**
     * Returns TRUE if the game was already finalized
     */
    function isFinalized() public view returns (bool) {
        return _finalized;
    }

    /**
     * Returns name of house team
     */
    function getHouseTeam() public view returns (string memory houseTeam) {
        return _houseTeam;
    }

    /**
     * Returns name of visitor team
     */
    function getVisitorTeam() public view returns (string memory visitorTeam) {
        return _visitorTeam;
    }

    /**
     * Returns name of datetime of the game
     */
    function getDateTimeGame() public view returns (uint256 dateTime) {
        return _datetimeGame;
    }

    /**
     * Returns the final score of the game
     */
    function getFinalScore() public view returns (Score memory finalScore) {
        return _finalScore;
    }

    /**
     * If neither a receive Ether nor a payable fallback function is present,
     * the contract cannot receive Ether through regular transactions and throws an exception.
     * A contract without a receive Ether function can receive Ether as a recipient of a
     * COINBASE TRANSACTION (aka miner block reward) or as a destination of a SELFDESTRUCT.
     * A contract cannot react to such Ether transfers and thus also cannot reject them.
     * This is a design choice of the EVM and Solidity cannot work around it.
     */
    function destroyContract() public onlyOwner {
        selfdestruct(payable(this.owner()));
    }
}
