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
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title Contract responsible for generate Game contracts and maintain a list of them
 * @author Fabiano Nascimento
 */
contract GameFactory is Ownable {
    // BetToken contract address
    address private _betTokenContractAddress;
    // All games registered
    Game[] private _games;

    /**
     * Event triggered when a new game is created
     */
    event GameCreated(
        address addressGame,
        string homeTeam,
        string visitorTeam,
        uint256 datetimeGame
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

    constructor(address betTokenContractAddress_) Ownable() {
        _betTokenContractAddress = betTokenContractAddress_;
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
    ) public onlyOwner {
        // a game starts closed for betting
        Game g = new Game(
            payable(this.owner()),
            _home,
            _visitor,
            _datetimeGame,
            _betTokenContractAddress
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
     * @notice Return the list of all games registered
     * @return games Array of games
     * @dev If you have a public state variable of array type, then you can only
     * retrieve single elements of the array via the generated getter function.
     * This mechanism exists to avoid high gas costs when returning an entire array.
     * If you want to return an entire array in one call, then you need to write a function
     */
    function listGames() public view returns (Game[] memory games) {
        return _games;
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
        // since the owner of Games contracts is this contract, it's necessary to destroy all of them before destroy the Factory
        for (uint256 i = 0; i < _games.length; i++) {
            if (isAliveContract(address(_games[i]))) {
                _games[i].destroyContract();
            }
        }
        selfdestruct(payable(this.owner()));
    }

    /**
     * @notice Checks if the address has some code, if it has, returns TRUE
     * @param addr Address Ethereum to check whether has code or not
     * @return return TRUE if the address has code
     */
    function isAliveContract(address addr) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(addr)
        }
        return size > 0;
    }
}
