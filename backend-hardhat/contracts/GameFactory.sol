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

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

import "hardhat/console.sol";

import "./Base.sol";
import "./BetToken.sol";
import "./Game.sol";
import "./OnlyDelegateCall.sol";
import "./structs/GameDTO.sol";

/**
 * @title Contract responsible for generate Game contracts and maintain a list of them
 * @author Fabiano Nascimento
 */
contract GameFactoryUpgradeable is
    Base,
    Initializable,
    OwnableUpgradeable,
    OnlyDelegateCall
{
    // BetToken proxy contract address
    address private betTokenContractAddress;
    // Calculator proxy contract address
    address private calculatorContractAddress;
    // Percentage of administration costs passed in the constructor of Game
    // It can be changed along the time by ADMINISTRATOR for new games.
    // However, after a Game is created, it can't be changed for that Game
    uint256 private commission;
    // The address of Game contract implementation (ERC-1167)
    address gameImplementation;

    /**
     * Event triggered when a new game is created
     */
    event GameCreated(
        address addressGame,
        string homeTeam,
        string visitorTeam,
        uint256 datetimeGame,
        uint256 commission,
        address owner
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
    ) external nonZeroAddress(_betTokenContractAddress) nonZeroAddress(_calculatorContractAddress) initializer onlyProxy {
        __Ownable_init();
        betTokenContractAddress = _betTokenContractAddress;
        calculatorContractAddress = _calculatorContractAddress;
        commission = 10;
        // create the implementation instance of Game contract
        gameImplementation = address(new Game());
    }

    /**
     * @notice returns the Game contract implementation
     */
    function getGameImplementation() external view returns (address) {
        return gameImplementation;
    }

    /**
     * @notice Allows the owner update the Game contract implementation for future games created
     */
    function setGameImplementation(address _gameImplementationAddress)
        external
        onlyOwner
        onlyProxy
    {
        /// @custom:oz-upgrades-unsafe-allow delegatecall
        require(Address.isContract(_gameImplementationAddress));
        gameImplementation = _gameImplementationAddress;
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
        string calldata _home,
        string calldata _visitor,
        uint256 _datetimeGame
    ) external onlyOwner {
        //Clones the Game contract implementation
        address clone = Clones.clone(gameImplementation);
        //calls Game.initialize
        Game g = Game(clone);

        //event moved to before the external call g.initilize as slither pointed out
        emit GameCreated(
            clone,
            _home,
            _visitor,
            _datetimeGame,
            commission,
            payable(this.owner())
        );

        // console.log("GameFactory address", address(this));
        // console.log("Template address", gameImplementation);
        // console.log("CLone address", clone);
        g.initialize(
            payable(this.owner()),
            _home,
            _visitor,
            _datetimeGame,
            betTokenContractAddress,
            calculatorContractAddress,
            commission
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
}
