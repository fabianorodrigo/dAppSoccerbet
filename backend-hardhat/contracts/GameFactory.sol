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

import "./BetToken.sol";
import "./Game.sol";
import "./libs/StringUtils.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./structs/GameDTO.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title Contract responsible for generate Game contracts and maintain a list of them
 * @author Fabiano Nascimento
 */
contract GameFactoryUpgradeable is Initializable, OwnableUpgradeable {
    // BetToken proxy contract address
    address private betTokenContractAddress;
    // Calculator proxy contract address
    address private calculatorContractAddress;
    // All games registered
    Game[] private _games;
    // Percentage of administration costs passed in the constructor of Game
    // It can be changed along the time by ADMINISTRATOR for new games.
    // However, after a Game is created, it can't be changed for that Game
    uint256 private commission;

    /**
     * Event triggered when a new game is created
     */
    event GameCreated(
        address addressGame,
        string homeTeam,
        string visitorTeam,
        uint256 datetimeGame
    );

    /**
     * Event triggered when the commission for future created Games changes
     */
    event CommissionChanged(uint256 oldCommission, uint256 newCommission);

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

    function initialize(
        address _betTokenContractAddress,
        address _calculatorContractAddress
    ) external initializer {
        __Ownable_init();
        betTokenContractAddress = _betTokenContractAddress;
        calculatorContractAddress = _calculatorContractAddress;
        commission = 10;
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
     * @notice Generate a new Game contract, register it and emits the GameCreated event
     *
     * @param _home Name of the team that is gonna play in home
     * @param _visitor Name of the team that is gonna be visiting
     * @param _datetimeGame The date/time of the game expressed in seconds
     */
    function newGame(
        string memory _home,
        string memory _visitor,
        uint256 _datetimeGame
    ) external onlyOwner {
        // a game starts closed for betting
        Game g = new Game(
            payable(this.owner()), //The owner of the game is the same owner of the GameFactory
            _home,
            _visitor,
            _datetimeGame,
            betTokenContractAddress,
            calculatorContractAddress,
            commission
        );
        _games.push(g);
        emit GameCreated(
            address(_games[_games.length - 1]),
            g.homeTeam(),
            g.visitorTeam(),
            g.datetimeGame()
        );
    }

    /**
     * @notice Return the current percentage of stake of future Games created directed to administration fee
     *
     * @return Percentage of fee for future created games
     */
    function getCommission() external view returns (uint256) {
        return commission;
    }

    /**
     * @notice Change the percentage of stake of future Games created directed to administration fee
     *
     * @param _commission New percentage of fee for future created games
     */
    function setCommission(uint256 _commission) external onlyOwner {
        uint256 old = commission;
        commission = _commission;
        emit CommissionChanged(old, commission);
    }

    /**
     * @notice Return the list of all games registered
     * @return games Array of games
     * @dev If you have a public state variable of array type, then you can only
     * retrieve single elements of the array via the generated getter function.
     * This mechanism exists to avoid high gas costs when returning an entire array.
     * If you want to return an entire array in one call, then you need to write a function
     *
     * @dev We're returning the struct GameDTO so as the frontEnd has all the basic data without
     * make requests to provider. Otherwise, the frontend receives just the contract address:
     * https://docs.soliditylang.org/en/v0.7.5/abi-spec.html#contract-abi-specification
     */
    function listGames() public view returns (GameDTO[] memory games) {
        GameDTO[] memory result = new GameDTO[](_games.length);
        for (uint256 i = 0; i < _games.length; i++) {
            Game g = _games[i];
            (uint8 home, uint8 visitor) = g.finalScore();
            result[i] = GameDTO(
                address(g),
                g.homeTeam(),
                g.visitorTeam(),
                g.datetimeGame(),
                g.open(),
                g.finalized(),
                Score(home, visitor)
            );
        }
        return result;
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
        // If gas costs are subject to change, then smart contracts can’t
        // depend on any particular gas costs. Any smart contract that uses
        // transfer() or send() is taking a hard dependency on gas costs by
        // forwarding a fixed amount of gas: 2300.
        //
        // Call returns a boolean value indicating success or failure.
        // This is the current recommended method to use
        (bool sent, ) = owner().call{value: address(this).balance}("");
        require(sent, "Fail to empty the contract");
    }
}
