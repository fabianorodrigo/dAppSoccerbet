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
import "./Calculator.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./libs/GameUtils.sol";

import "hardhat/console.sol";

/**
 * @title Contract that represents a single game and e responsible for managing all bets
 * and prizes about this specific game
 *
 * @author Fabiano Nascimento
 */
contract Game is Ownable, ReentrancyGuard {
    uint8 public immutable PAID = 4;
    uint8 public immutable TIED = 3;
    uint8 public immutable WINNER = 2;
    uint8 public immutable LOSER = 1;
    uint8 public immutable NO_RESULT = 0;

    //BetToken contract
    BetTokenUpgradeable private _betTokenContract;
    // Calculator contract
    CalculatorUpgradeable private _calculator;
    // Percentage of all bets reverted for administration costs
    // After a Game is created, it can't be changed
    uint256 commission = 10;
    //When open, bettors can bet
    bool public open;
    string public homeTeam;
    string public visitorTeam;
    //datetime of the game in seconds
    uint256 public datetimeGame;
    //bets
    Bet[] private _bets;
    //total stake
    uint256 private _totalStake = 0;
    //sum of tokens among winning bets
    uint256 private _totalTokensBetWinners = 0;
    //real final score
    Score public finalScore;
    //When TRUE, the game is already finalized
    bool public finalized;
    // When TRUE, the process of identifying winners is completed
    bool public winnersIdentified;
    // When TRUE, the process of calc prizes is completed
    bool public prizesCalculated;

    // iteraction variables in order to avoid DoS Costly loops
    // in case the number of bets is too high
    uint256 private _idWinners_i = 0;
    uint256 private _calcPrize_i = 0;

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
     * @notice Event triggered when someone bet on a game
     */
    event BetOnGame(
        address indexed addressGame,
        address indexed addressBettor,
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

    /**
     * @notice Instance a new Game
     * @param _owner The GameFactory establishes the owner of the Game. Tipycally, the same GameFactory owner
     * @param _home The name of the team playing at home
     * @param _visitor The name of the team playing out of home
     * @param _datetimeGame The date/time scheduled to start the game
     * @param _betTokenContractAddress The address of the BetToken contract used for the Game
     * @param _calculatorContractAddress The address of the Calculator Contract used for the Game
     * @param _commission The percentage of stake that will be reverted to administrative costs
     */
    constructor(
        address payable _owner,
        string memory _home,
        string memory _visitor,
        uint256 _datetimeGame,
        address _betTokenContractAddress,
        address _calculatorContractAddress,
        uint256 _commission
    ) Ownable() {
        homeTeam = _home;
        visitorTeam = _visitor;
        datetimeGame = _datetimeGame;
        open = false;
        finalized = false;
        _betTokenContract = BetTokenUpgradeable(
            payable(_betTokenContractAddress)
        );
        _calculator = CalculatorUpgradeable(_calculatorContractAddress);
        commission = _commission;
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
    function openForBetting() external onlyOwner {
        require(open == false, "The game is not closed");
        require(finalized == false, "Game has been already finalized");
        open = true;
        emit GameOpened(address(this), homeTeam, visitorTeam, datetimeGame);
    }

    /**
     * @notice Make a bet in the game. Only allowed if the game is open for betting,
     * the game is not finalized.
     * Also, there must be a number of tokens that GAME CONTRACT, the `spender`, is
     * allowed to spend on behalf of the BETTOR, `owner` of BetTokens, equal or
     * greater than _value.
     *
     * Emits the event BetOnGame
     *
     * @param _score The score guessed by the bettor
     * @param _value The amount of BetToken put on the bet by the player
     */
    function bet(Score memory _score, uint256 _value) external {
        require(open, "The game is not open");
        require(_value > 0, "The betting value has to be greater than zero");
        require(finalized == false, "Game has been already finalized");
        require(
            _betTokenContract.balanceOf(msg.sender) >= _value,
            "BetToken balance insufficient"
        );
        //In the BetToken, the sender is gonna be Game Contract.
        //In this case, before calling 'bet' function, the bettor has
        //to approve the spent of at least the amount of tokens of this bet
        //Then, the 'transferFrom' can tranfer those tokens to Game contract itself
        if (_betTokenContract.transferFrom(msg.sender, address(this), _value)) {
            _bets.push(Bet(msg.sender, _score, _value, NO_RESULT, 0));
            _totalStake += _value;
            emit BetOnGame(
                address(this),
                msg.sender,
                homeTeam,
                visitorTeam,
                datetimeGame,
                _score
            );
        }
    }

    /**
     * @notice Closes a game for betting (sets the open to FALSE). Only
     * allowed if the game is open for betting. Emits the event GameClosed
     */
    function closeForBetting() external onlyOwner {
        require(open, "The game is not open");
        require(finalized == false, "Game has been already finalized");
        open = false;
        emit GameClosed(address(this), homeTeam, visitorTeam, datetimeGame);
    }

    /**
     * @notice Finalize the game registering the final score. Only allowed
     * if the game is closed and not yet finalized. Emits the event GameFinalized
     *
     * @param _finalScore Data of the final score of the match
     */
    function finalizeGame(Score memory _finalScore) external onlyOwner {
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
            homeTeam,
            visitorTeam,
            datetimeGame,
            finalScore
        );
    }

    /**
     * @notice Identify which bets matched the finalScore and updates: _bets[i].result,
     * _totalTokensBetWinners,
     *
     * @return TRUE if the process of identifying winners is completed (loop for all _bets)
     */
    function identifyWinners() external onlyOwner returns (bool) {
        require(finalized, "Game not finalized");
        require(winnersIdentified == false, "Winners identified");

        // Each interaction of this loops is spending around 30K gas
        // The loop continues until the end or the gasleft() > 30K
        for (
            ;
            _idWinners_i <
            GameUtils.identifyWinners(_bets, finalScore).length &&
                gasleft() > 30000;
            _idWinners_i++
        ) {
            _bets[_idWinners_i].result = WINNER;
            _totalTokensBetWinners += _bets[_idWinners_i].value;
            console.log(
                "first loop: gasleft after",
                _idWinners_i,
                ": ",
                gasleft()
            );
        }
        //If iterator >= number of bets, all the elements were visited
        if (_idWinners_i >= _bets.length) {
            winnersIdentified = true;
        }
        return winnersIdentified;
    }

    /**
     * @notice Calculate the prize (stake less comission fee) between the bets proportionally to the bet value.
     * If none bet matches, the prize is split proportionally for all
     *
     * @return TRUE if the process of calc prizes is completed (loop for all _bets)
     */
    function calcPrizes() external onlyOwner returns (bool) {
        require(winnersIdentified, "Winners not identified");
        require(prizesCalculated == false, "Prizes calculated");

        uint256 _totalPrize = this.getPrize();
        uint256 _divider;
        // if nobody matches the final score, every bettor is refunded with
        // the value of he's bet less the commission fee
        // In this case, the divider applyed to the formula will be the total stake
        if (_totalTokensBetWinners == 0) {
            _divider = _totalStake;
        }
        //Otherwise, the divider will be the _totalTokensBetWinners
        else {
            _divider = _totalTokensBetWinners;
        }

        // Each interaction of this loops is spending around 30K gas
        // The loop continues until the end or the gasleft() > 30K
        for (
            ;
            _calcPrize_i < _bets.length && gasleft() > 30000;
            _calcPrize_i++
        ) {
            //If nobody matches the final score, _totalTokensBetWinners will be zero
            //and it will always return TRUE. Otherwise, only when for bets that matched
            //the final score the IF will be TRUE
            if (
                _bets[_calcPrize_i].result == WINNER ||
                _totalTokensBetWinners == 0
            ) {
                // The value transfered will be proportional: prize * the value of bet divided by
                // the total of tokens of the winning bets (if nobody wins, the total stake)
                uint256 _prizeValue = (_totalPrize *
                    _bets[_calcPrize_i].value) / _divider;
                _bets[_calcPrize_i].prize = _prizeValue;
                //if totalTokensBetWinners equals zero, nobody won and the result is TIED
                if (_totalTokensBetWinners == 0) {
                    _bets[_calcPrize_i].result = TIED;
                }
            }
            console.log(
                "second loop: gasleft after",
                _calcPrize_i,
                ": ",
                gasleft()
            );
        }
        //If iterator >= number of bets, all the elements were visited
        if (_calcPrize_i >= _bets.length) {
            prizesCalculated = true;
        }
        return prizesCalculated;
    }

    /**
     * @notice Function called by the bettor in order to withdrawal it's prize
     *
     * @param _betIndex the index of Bet being withdrawn
     */
    function withdrawPrize(uint256 _betIndex) external nonReentrant {
        require(_betIndex < _bets.length, "_betIndex invalid");
        require(
            _bets[_betIndex].result == WINNER ||
                _bets[_betIndex].result == TIED,
            "Without result, loser or already paid bets have no prize to be withdrawn"
        );
        require(
            _bets[_betIndex].bettor == msg.sender,
            "The prize can be withdrawn just by the bet's bettor"
        );
        _bets[_betIndex].result = PAID;
        bool tokensSent = _betTokenContract.transfer(
            _bets[_betIndex].bettor,
            _bets[_betIndex].prize
        );
        //console.log("sender", msg.sender);
        //console.log("balance", address(this).balance);
        require(tokensSent, "Fail to pay the prize");
    }

    /**
     * @notice If neither a receive Ether nor a payable fallback function is present,
     * the contract cannot receive Ether through regular transactions and throws an exception.
     * A contract without a receive Ether function can receive Ether as a recipient of a
     * COINBASE TRANSACTION (aka miner block reward) or as a destination of a SELFDESTRUCT.
     * A contract cannot react to such Ether transfers and thus also cannot reject them.
     * This is a design choice of the EVM and Solidity cannot work around it.
     */
    function destroyContract() external onlyOwner {
        selfdestruct(payable(this.owner()));
    }

    /**
     * @notice Return the list of all bets registered for the current game
     * @return bets Array of bettings
     * @dev If you have a public state variable of array type, then you can only
     * retrieve single elements of the array via the generated getter function.
     * This mechanism exists to avoid high gas costs when returning an entire array.
     * If you want to return an entire array in one call, then you need to write a function
     */
    function listBets() public view returns (Bet[] memory bets) {
        return _bets;
    }

    /**
     * @notice Return the sum of value in BetTokens of all bets
     * @return the stake of all bets, the amount of BetToken
     */
    function getTotalStake() public view returns (uint256) {
        return _totalStake;
    }

    /**
     * @notice Return percentage of {commission} applyed on the sum of value in BetTokens of all bets
     * @return administration commission
     */
    function getCommissionValue() public view returns (uint256) {
        return _calculator.calcPercentage(_totalStake, commission);
    }

    /**
     * @notice Return the sum of value in BetTokens of all bets discounted the commission for administration
     * @return stake value less commissions
     */
    function getPrize() public view returns (uint256) {
        return _totalStake - this.getCommissionValue();
    }
}
