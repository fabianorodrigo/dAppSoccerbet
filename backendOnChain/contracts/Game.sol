// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

/** SOLIDITY STYLE GUIDE **

Layout contract elements in the following order:

Pragma statements
Import statements
Interfaces
Libraries
Contracts

Inside each contract, library or interface, use the following order:

Type declarations
State variables
Events
Functions
*/

import "./structs/Score.sol";
import "./structs/Bet.sol";
import "./BetToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Contract that represents a single game and e responsible for managing all bets
 * and prizes about this specific game
 *
 * @author Fabiano Nascimento
 */
contract Game is Ownable {
    //BetToken contract
    BetToken private _betTokenContract;
    //When open, gamblers can bet
    bool public open;
    string public houseTeam;
    string public visitorTeam;
    //datetime of the game in seconds
    uint256 public datetimeGame;
    //bets
    Bet[] public bets;
    //real final score
    Score public finalScore;
    //When TRUE, the game is already finalized
    bool public finalized;

    /**
     * @notice Event triggered when a game is opened for betting
     */
    event GameOpened(
        address addressGame,
        string homeTeam,
        string visitorTeam,
        uint256 datetimeGame
    );
    /**
     * @notice Event triggered when a game is closed for betting
     */
    event GameClosed(
        address addressGame,
        string homeTeam,
        string visitorTeam,
        uint256 datetimeGame
    );
    /**
     * @notice Event triggered when a game is finalized
     */
    event GameFinalized(
        address addressGame,
        string homeTeam,
        string visitorTeam,
        uint256 datetimeGame,
        Score score
    );
    /**
     * @notice Event triggered when a game has the final score updated
     */
    event GameFinalScoreUpdated(
        address addressGame,
        string homeTeam,
        string visitorTeam,
        uint256 datetimeGame,
        Score score
    );

    /** SOLIDITY STYLE GUIDE **

        Order of Functions

        constructor
        receive function (if exists)
        fallback function (if exists)
        external
        public
        internal
        private
        **/

    constructor(
        address payable _owner,
        string memory _house,
        string memory _visitor,
        uint256 _datetimeGame,
        address _betTokenContractAddress
    ) Ownable() {
        houseTeam = _house;
        visitorTeam = _visitor;
        datetimeGame = _datetimeGame;
        open = false;
        finalized = false;
        _betTokenContract = BetToken(payable(_betTokenContractAddress));
        transferOwnership(_owner);
    }

    /** SOLIDITY STYLE GUIDE **

    The modifier order for a function should be:

        Visibility
        Mutability
        Virtual
        Override
        Custom modifiers
     */

    /**
     * @notice Opens a game for betting (sets the open to TRUE). Only allowed
     * if the game is closed for betting. Emits the event GameOpened
     */
    function openForBetting() public onlyOwner {
        require(open == false, "The game is not closed");
        require(finalized == false, "Game has been already finalized");
        open = true;
        emit GameOpened(address(this), houseTeam, visitorTeam, datetimeGame);
    }

    /**
     * @notice Closes a game for betting (sets the open to FALSE). Only
     * allowed if the game is open for betting. Emits the event GameClosed
     */
    function closeForBetting() public onlyOwner {
        require(open, "The game is not open");
        require(finalized == false, "Game has been already finalized");
        open = false;
        emit GameClosed(address(this), houseTeam, visitorTeam, datetimeGame);
    }

    /**
     * @notice Finalize the game registering the final score. Only allowed
     * if the game is closed and not yet finalized. Emits the event GameFinalized
     *
     * @param _finalScore Data of the final score of the match
     */
    function finalizeGame(Score memory _finalScore) public onlyOwner {
        require(finalized == false, "The game has been already finalized");
        require(
            open == false,
            "The game is still open for bettings, close it first"
        );
        // register the final score and finalizes the game
        finalScore = _finalScore;
        finalized = true;
        emit GameFinalized(
            address(this),
            houseTeam,
            visitorTeam,
            datetimeGame,
            finalScore
        );
    }

    /**
     * @notice Edit the score of a finalized game just in case something was wrong.
     * Only allowed if the game is finalized. Emits the event GameFinalScoreUpdated
     *
     * @param _finalScore Data of the final score of the match
     */
    function editFinalizedGameScore(Score memory _finalScore) public onlyOwner {
        require(
            finalized,
            "The game hasn't been finalized yet. Call finalizeGame function"
        );
        // register the final score and finalizes the game
        finalScore = _finalScore;
        emit GameFinalScoreUpdated(
            address(this),
            houseTeam,
            visitorTeam,
            datetimeGame,
            finalScore
        );
    }

    /**
     * @notice If neither a receive Ether nor a payable fallback function is present,
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
