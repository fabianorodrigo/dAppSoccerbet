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
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./structs/GameDTO.sol";

import "./OnlyDelegateCall.sol";

/**
 * @title Contract that represents a single game and e responsible for managing all bets
 * and prizes about this specific game
 *
 * @dev Since the Openzeppelin clones (ERC1167) are actually a minimal proxy to the code of the
 * first instance deployed that delegate all calls to that first instance, it has to be OnlyDelegateCall
 * inherited so as no calls can be made direct to it, specially the self destruct
 *
 * @author Fabiano Nascimento
 */
contract Game is Initializable, Ownable, ReentrancyGuard, OnlyDelegateCall {
    uint8 public constant PAID = 4;
    uint8 public constant TIED = 3;
    uint8 public constant WINNER = 2;
    uint8 public constant LOSER = 1;
    uint8 public constant NO_RESULT = 0;

    /***
     * A function demands that the Game is opened for betting and it is closed
     */
    error GameNotOpen();
    /***
     * A function demands that the Game is closed for betting and it is open
     */
    error GameNotClosed();
    /***
     * A function demands that the Game has not been finalized yet and it has
     */
    error GameAlreadyFinalized();
    /***
     * A function demands that the Game has been finalized and it has not
     */
    error GameNotFinalized();
    /***
     * The bettor tryed to bet a value less or equal zero
     */
    error InvalidBettingValue();
    /***
     * A function received a reference to a bet the is out of the bounds of game array
     */
    error InvalidBetIndex();
    /***
     * The bettor tryed to withdraw the prize of a bet that has a invalid status
     *
     * @param currentResult The current result of bet
     */
    error InvalidBettingResultForWithdrawing(uint8 currentResult);
    /***
     * The bettor tryed to bet a value that is beyond its Bet Token balance
     *
     * @param currentBalance The current Bet Token balance of the msg.sender
     */
    error InsufficientTokenBalance(uint256 currentBalance);
    /***
     * Someone different from the bettor of a bet is trying to withdraw the prize
     *
     * @param bettor The address of the account that made the bet
     */
    error InvalidPrizeWithdrawer(address bettor);
    /***
     * When all the winner have already been identified, someone is calling the function
     * that identifies winners
     */
    error WinnersAlreadyKnown();
    /***
     * A function demands that all the winners bettors of the game have already been
     * identified and they haven't
     */
    error UnknownWinners();
    /***
     * When the prize of all winners bets have already been calculated, someone is calling
     * the function that calculates the prizes
     */
    error PrizesAlreadyCalculated();
    /***
     * A function demands that all the prizes of the winner bets of the game have already been
     * calculated and they haven't
     */
    error PrizesNotCalculated();

    /**
     * An operation of token tranfer failed
     */
    error TokenTransferFail();
    /***
     * A function demands that the msg.sender is the owner or has past 15 minutes after Game has started
     */
    error onlyOwnerORgameAlreadyBegun();
    /***
     * A function demands that the msg.sender is the owner or has past 48 hours after Game has started
     */
    error onlyOwnerORgameAlreadyFinished();

    //BetToken contract
    BetTokenUpgradeable private _betTokenContract;
    // Calculator contract
    CalculatorUpgradeable private _calculator;
    // Percentage of all bets reverted for administration costs
    // After a Game is created, it can't be changed
    uint256 public commission = 10;
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
    uint256 public totalTokensBetWinners = 0;
    //real final score
    Score public finalScore;
    //When TRUE, the game is already finalized
    bool public finalized;
    // When TRUE, the process of identifying winners is completed
    bool public winnersIdentified;
    // Minimum gas for continue for the next interaction in the
    // process of identify the winner bets
    uint256 private constant GAS_INTERACTION_WINNERS_IDENTIFICATION = 35000;
    // When TRUE, the process of calc prizes is completed
    bool public prizesCalculated;
    // Minimum gas for continue for the next interaction in the
    // process of calculate prizes
    uint256 private constant GAS_INTERACTION_CALC_PRIZES = 40000;

    // Indexes of winner bets in {_bets}. Persisted on storage so as we have
    // a cheap loop in calcPrizes
    uint256[] private _winnerBetsIndexes;

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
        Score finalScore
    );

    /**
     * @notice Event triggered when a game has its winner bets identified
     */
    event GameWinnersIdentified(
        address addressGame,
        string homeTeam,
        string visitorTeam,
        uint256 datetimeGame
    );
    /**
     * @notice Event triggered when a game has the prizes calculated
     */
    event GamePrizesCalculated(
        address addressGame,
        string homeTeam,
        string visitorTeam,
        uint256 datetimeGame
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

    /// @notice Demands that the Game be closed for betting. Otherwise, reverts with {GameNotClosed}
    modifier isClosed() {
        if (open) {
            revert GameNotClosed();
        }
        _;
    }

    /// @notice Demands that the Game be opened for betting. Otherwise, reverts with {GameNotOpen}
    modifier isOpen() {
        if (!open) {
            revert GameNotOpen();
        }
        _;
    }

    /// @notice Demands that the Game has not finalized yet. Otherwise, reverts with {GameAlreadyFinalized}
    modifier isNotFinalized() {
        if (finalized) {
            revert GameAlreadyFinalized();
        }
        _;
    }

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

    constructor() Ownable() {}

    /**
     * @notice Initialize the contract's state variables
     *
     * @param _owner The GameFactory establishes the owner of the Game. Tipycally, the same GameFactory owner
     * @param _home The name of the team playing at home
     * @param _visitor The name of the team playing out of home
     * @param _datetimeGame The date/time scheduled to start the game
     * @param _betTokenContractAddress The address of the BetToken contract used for the Game
     * @param _calculatorContractAddress The address of the Calculator Contract used for the Game
     * @param _commission The percentage of stake that will be reverted to administrative costs
     */
    function initialize(
        address payable _owner,
        string calldata _home,
        string calldata _visitor,
        uint256 _datetimeGame,
        address _betTokenContractAddress,
        address _calculatorContractAddress,
        uint256 _commission
    ) external initializer onlyProxy {
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
        _transferOwnership(_owner);
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
     * @notice returns the DTO with the game`s data
     */
    function getDTO() external view returns (GameDTO memory) {
        (uint8 home, uint8 visitor) = this.finalScore();
        return
            GameDTO(
                address(this),
                homeTeam,
                visitorTeam,
                datetimeGame,
                open,
                finalized,
                Score(home, visitor),
                winnersIdentified,
                prizesCalculated,
                commission
            );
    }

    /**
     * @notice Opens a game for betting (sets the open to TRUE). Only allowed
     * if the game is closed for betting. Emits the event GameOpened
     *
     * Events: GameOpened
     * Custom Errors: GameNotClosed, GameAlreadyFinalized
     */
    function openForBetting()
        external
        onlyProxy
        onlyOwner
        isClosed
        isNotFinalized
    {
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
     * Events: BetOnGame
     * Custom Errors: GameNotOpen, GameAlreadyFinalized, InvalidBettingValue, InsufficientTokenBalance
     *
     * @param _score The score guessed by the bettor
     * @param _value The amount of BetToken put on the bet by the player
     */
    function bet(Score calldata _score, uint256 _value)
        external
        onlyProxy
        isOpen
        isNotFinalized
    {
        if (_value <= 0) {
            revert InvalidBettingValue();
        }
        uint256 _senderTokenBalance = _betTokenContract.balanceOf(msg.sender);
        if (_senderTokenBalance < _value) {
            revert InsufficientTokenBalance({
                currentBalance: _senderTokenBalance
            });
        }

        //In the Bet Token, the sender is gonna be Game Contract.
        //In this case, before calling 'bet' function, the bettor has
        //to approve the spent of at least the amount of tokens of this bet
        //Then, the 'transferFrom' can tranfer those tokens to Game contract itself
        if (
            !_betTokenContract.transferFrom(msg.sender, address(this), _value)
        ) {
            revert TokenTransferFail();
        }

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

    /**
     * @notice Closes a game for betting (sets the open to FALSE). Only
     * allowed if the game is open for betting. Emits the event GameClosed
     *
     * Events: GameClosed
     * Custom Errors: GameNotOpen, GameAlreadyFinalized
     */
    function closeForBetting() external onlyProxy isOpen isNotFinalized {
        if (!canClose()) {
            revert onlyOwnerORgameAlreadyBegun();
        }
        open = false;
        emit GameClosed(address(this), homeTeam, visitorTeam, datetimeGame);
    }

    /**
     * @notice Finalize the game registering the final score. Only allowed
     * if the game is closed and not yet finalized. Emits the event GameFinalized
     *
     * Events: GameFinalized
     * Custom Errors: GameAlreadyFinalized, GameNotClosed
     *
     * @param _finalScore Data of the final score of the match
     */
    function finalizeGame(Score calldata _finalScore)
        external
        onlyProxy
        isClosed
        isNotFinalized
    {
        if (!canFinalize()) {
            revert onlyOwnerORgameAlreadyFinished();
        }
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
     * Custom Errors: GameNotFinalized, WinnersAlreadyKnown
     *
     * @return TRUE if the process of identifying winners is completed (loop for all _bets)
     */
    function identifyWinners() external onlyProxy returns (bool) {
        if (!finalized) {
            revert GameNotFinalized();
        }
        if (winnersIdentified) {
            revert WinnersAlreadyKnown();
        }

        // Each interaction of this loops is spending around 30K gas
        // The loop continues until the end or the gasleft() > GAS_INTERACTION_WINNERS_IDENTIFICATION
        for (
            ;
            _idWinners_i < _bets.length &&
                gasleft() > GAS_INTERACTION_WINNERS_IDENTIFICATION;
            _idWinners_i++
        ) {
            if (
                _bets[_idWinners_i].score.home == finalScore.home &&
                _bets[_idWinners_i].score.visitor == finalScore.visitor
            ) {
                _bets[_idWinners_i].result = WINNER;
                totalTokensBetWinners += _bets[_idWinners_i].value;
                _winnerBetsIndexes.push(_idWinners_i);
            } else {
                _bets[_idWinners_i].result = LOSER;
            }
            //console.log(_idWinners_i, _bets.length);
        }

        //If iterator >= number of bets, all the elements were visited
        if (_idWinners_i >= _bets.length) {
            winnersIdentified = true;
            emit GameWinnersIdentified(
                address(this),
                homeTeam,
                visitorTeam,
                datetimeGame
            );
        }
        return winnersIdentified;
    }

    /**
     * @notice Calculate the prize (stake less comission fee) between the bets proportionally to the bet value.
     * If none bet matches, the prize is split proportionally for all
     *
     * Custom Errors: UnknownWinners, PrizesAlreadyCalculated
     *
     * @return TRUE if the process of calc prizes is completed (loop for all _bets)
     */
    function calcPrizes() external onlyProxy returns (bool) {
        if (!winnersIdentified) {
            revert UnknownWinners();
        }
        if (prizesCalculated) {
            revert PrizesAlreadyCalculated();
        }

        // if nobody matches the final score, every bettor is refunded with
        // the value of he's bet less the commission fee.
        if (totalTokensBetWinners == 0) {
            return _calcTiedPrizes(this.getPrize());
        } else {
            bool retorno = _calcWinnerPrizes(this.getPrize());
            // console.log("retorno retorno", retorno);
            return retorno;
        }
    }

    /**
     * @notice Function called by the bettor in order to withdrawal it's prize
     *
     * Events: GameClosed
     * Custom Errors: PrizesNotCalculated, InvalidBetIndex, InvalidBettingResultForWithdrawing(currentResult),
     *  InvalidPrizeWithdrawer(bettor)
     *
     * @param _betIndex the index of Bet being withdrawn
     */
    function withdrawPrize(uint256 _betIndex) external nonReentrant onlyProxy {
        if (!prizesCalculated) {
            revert PrizesNotCalculated();
        }
        //Invalid _betIndex
        if (_betIndex >= _bets.length) {
            revert InvalidBetIndex();
        }
        //Without result, loser or already paid bets have no prize to be withdrawn
        if (
            _bets[_betIndex].result != WINNER && _bets[_betIndex].result != TIED
        ) {
            revert InvalidBettingResultForWithdrawing({
                currentResult: _bets[_betIndex].result
            });
        }

        if (_bets[_betIndex].bettor != msg.sender) {
            revert InvalidPrizeWithdrawer({bettor: _bets[_betIndex].bettor});
        }
        _bets[_betIndex].result = PAID;
        if (
            !_betTokenContract.transfer(
                _bets[_betIndex].bettor,
                _bets[_betIndex].prize
            )
        ) {
            revert TokenTransferFail();
        }
    }

    /**
     * @notice If neither a receive Ether nor a payable fallback function is present,
     * the contract cannot receive Ether through regular transactions and throws an exception.
     * A contract without a receive Ether function can receive Ether as a recipient of a
     * COINBASE TRANSACTION (aka miner block reward) or as a destination of a SELFDESTRUCT.
     * A contract cannot react to such Ether transfers and thus also cannot reject them.
     * This is a design choice of the EVM and Solidity cannot work around it.
     */
    function destroyContract() external onlyProxy onlyOwner {
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
    function listBets() external view returns (Bet[] memory bets) {
        return _bets;
    }

    /**
     * @notice Return the sum of value in BetTokens of all bets
     * @return the stake of all bets, the amount of BetToken
     */
    function getTotalStake() external view returns (uint256) {
        return _totalStake;
    }

    /**
     * @notice Return the sum of value in BetTokens of all bets discounted the commission for administration
     * @return stake value less commissions
     */
    function getPrize() external view returns (uint256) {
        return _totalStake - this.getCommissionValue();
    }

    /**
     * @notice Return percentage of {commission} applyed on the sum of value in BetTokens of all bets
     * @return administration commission
     */
    function getCommissionValue() external view returns (uint256) {
        return _calculator.calcPercentage(_totalStake, commission);
    }

    /// @notice Indicates the permission to close the game based on the msg.sender and the time
    // scheduled to start the game. If the msg.sender is the owner, he has always the permission
    // to do it (not considering if the game is already closed or even finalized). If msg.sender
    // is not the owner, then he is only allowed to close the game if it has passed 15 minutes
    // from the time foreseen to start the game
    function canClose() public view returns (bool) {
        // console.log("owner", owner());
        // console.log("_msgSender", _msgSender());
        // console.log("block.timestamp", block.timestamp);
        // console.log("datetimeGame + 15 * 60", datetimeGame + 15 * 60);
        // console.log(
        //     "passou o tempo",
        //     block.timestamp >= datetimeGame + 15 * 60
        // );
        return
            owner() == _msgSender() ||
            block.timestamp >= datetimeGame + 15 * 60;
    }

    /// @notice Indicates the permission to finalize the game based on the msg.sender and the time
    // scheduled to start the game. If the msg.sender is the owner, he has always the permission
    // to do it (not considering if the game is already finalized or still open). If msg.sender
    // is not the owner, then he is only allowed to finalize the game if it has passed 48 hours
    // from the time foreseen to start the game
    function canFinalize() public view returns (bool) {
        // console.log("owner", owner());
        // console.log("_msgSender", _msgSender());
        // console.log("block.timestamp", block.timestamp);
        // console.log("datetimeGame + 48 * 60 * 60", datetimeGame + 48 * 60 * 60);
        // console.log(
        //     "passou o tempo",
        //     block.timestamp >= datetimeGame + 48 * 60 * 60
        // );
        return
            owner() == _msgSender() ||
            block.timestamp >= datetimeGame + 48 * 60 * 60;
    }

    /**
     * @notice When there is winner bets, at least one matched the game's final score, this function
     * calculate the prize (stake less comission fee) between the bets proportionally to the bet value
     * based on the array _winnerBetsIndexes.
     *
     * @param _totalPrize The total stake less administration fees
     *
     * @return TRUE if the process of calc prizes is completed (loop for all _winnerBetsIndexes)
     */
    function _calcWinnerPrizes(uint256 _totalPrize) private returns (bool) {
        // Each interaction of this loops is spending around 30K gas
        // The loop continues until the end or the gasleft() > 30K
        //console.log("calcWinner", _winnerBetsIndexes.length);
        for (
            ;
            _calcPrize_i < _winnerBetsIndexes.length &&
                gasleft() > GAS_INTERACTION_CALC_PRIZES;
            _calcPrize_i++
        ) {
            //console.log(_calcPrize_i);
            // The value transfered will be proportional: prize * the value of bet divided by
            // the total of tokens of the winning bets (if nobody wins, the total stake)
            uint256 i = _winnerBetsIndexes[_calcPrize_i];
            //console.log("i", i);
            uint256 _prizeValue = (_totalPrize * _bets[i].value) /
                totalTokensBetWinners;
            //console.log("prize", _prizeValue);
            _bets[i].prize = _prizeValue;
            //console.log("_bets[i].prize", _bets[i].prize);
        }
        //console.log("saiu do loop", totalTokensBetWinners);
        //If iterator >= number of winner bets, all the elements were visited
        if (_calcPrize_i >= _winnerBetsIndexes.length) {
            prizesCalculated = true;
            emit GamePrizesCalculated(
                address(this),
                homeTeam,
                visitorTeam,
                datetimeGame
            );
        }
        //console.log("return ", prizesCalculated);
        return prizesCalculated;
    }

    /**
     * @notice When there is NOT winner bets, nobody matched the game's final score, this function
     * calculate the prize is split proportionally for all
     *
     * @param _totalPrize The total stake less administration fees
     *
     * @return TRUE if the process of calc prizes is completed (loop for all _winnerBetsIndexes)
     */
    function _calcTiedPrizes(uint256 _totalPrize) private returns (bool) {
        // Each interaction of this loops is spending around 30K gas
        // The loop continues until the end or the gasleft() > 30K
        for (
            ;
            _calcPrize_i < _bets.length &&
                gasleft() > GAS_INTERACTION_CALC_PRIZES;
            _calcPrize_i++
        ) {
            // console.log("calcTied");
            // console.log(_calcPrize_i);
            // The value transfered will be proportional: prize * the value of bet divided by
            // the total stake
            uint256 _prizeValue = (_totalPrize * _bets[_calcPrize_i].value) /
                _totalStake;
            _bets[_calcPrize_i].prize = _prizeValue;
            //The result is TIED
            _bets[_calcPrize_i].result = TIED;
        }
        //If iterator >= number of bets, all the elements were visited
        if (_calcPrize_i >= _bets.length) {
            prizesCalculated = true;
            emit GamePrizesCalculated(
                address(this),
                homeTeam,
                visitorTeam,
                datetimeGame
            );
        }
        return prizesCalculated;
    }
}
