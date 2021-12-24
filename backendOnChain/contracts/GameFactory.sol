// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./BetToken.sol";
import "./Game.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

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

    constructor(address betTokenContractAddress_) Ownable() {
        _betTokenContractAddress = betTokenContractAddress_;
    }

    /**
     * Register a new Game and, as soon as open, receive bets
     * @param house_ Name of the team that is gonna play in house
     * @param visitor_ Name of the team that is gonna be visiting
     * @param datetimeGame_ The date/time of the game expressed in seconds
     */
    function newGame(
        string memory house_,
        string memory visitor_,
        uint256 datetimeGame_
    ) public onlyOwner {
        // a game starts closed for betting
        Game g = new Game(
            house_,
            visitor_,
            datetimeGame_,
            _betTokenContractAddress
        );
        _games.push(g);
        emit GameCreated(
            address(_games[_games.length - 1]),
            _games[_games.length - 1].getHouseTeam(),
            _games[_games.length - 1].getVisitorTeam(),
            _games[_games.length - 1].getDateTimeGame()
        );
    }

    /**
     * Return all games
     */
    function listGames() public view returns (Game[] memory games) {
        return _games;
    }

    /**
     * Open a specific game for bettings
     * @param gameIndex the index of the game to be opened in the games array
     */
    function openGameForBetting(uint256 gameIndex) public onlyOwner {
        require(
            gameIndex < _games.length,
            string(
                bytes.concat(
                    bytes("Game not found in the game list of length: "),
                    bytes(Strings.toString(_games.length))
                )
            )
        );
        // get the reference to the Game of the index
        Game g = _games[gameIndex];
        // set it's "open" attribute
        g.openForBetting();
    }

    /**
     * Close a specific game for bettings
     *
     * @param gameIndex the index of the game to be closed in the games array
     */
    function closeGameForBetting(uint256 gameIndex) public onlyOwner {
        require(gameIndex < _games.length, "Game not found in the game list");
        // get the reference to the Game of the index
        Game g = _games[gameIndex];
        g.closeForBetting();
    }

    /**
     * Finalizes the game registering the final score
     *
     * @param gameIndex Index of the game to be finalized in the game list
     * @param finalScore_ Data of the final score of the match
     */
    function finalizeGame(uint256 gameIndex, Score memory finalScore_)
        public
        onlyOwner
    {
        require(gameIndex < _games.length, "Game not found in the game list");
        // get the reference to the Game of the index
        Game g = _games[gameIndex];
        // set it's "open" attribute
        g.finalizeGame(finalScore_);
    }

    /**
     * Alllows edit the score of a finalized game just in case something was wrong
     * @param gameIndex Index of the game to be edited in the _games list
     * @param finalScore_ Data of the final score of the match
     */
    function editFinalizedGameScore(uint256 gameIndex, Score memory finalScore_)
        public
        onlyOwner
    {
        require(gameIndex < _games.length, "Game not found in the game list");
        // get the reference to the Game of the index
        Game g = _games[gameIndex];
        g.editFinalizedGameScore(finalScore_);
    }

    /**
     * Destroy a specific Game contract if it's been finalized already
     *
     * @param gameIndex Index of the game to be edited in the _games list
     */
    function destroyGameContract(uint256 gameIndex) public onlyOwner {
        require(gameIndex < _games.length, "Game not found in the game list");
        // get the reference to the Game of the index
        Game g = _games[gameIndex];
        g.destroyContract();
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
        // since the owner of Games contracts is this contract, it's necessary to destroy all of them before destroy the Factory
        for (uint256 i = 0; i < _games.length; i++) {
            if (isAliveContract(address(_games[i]))) {
                _games[i].destroyContract();
            }
        }
        selfdestruct(payable(this.owner()));
    }

    /**
     * Checks if the address has some code, if it has, returns TRUE
     */
    function isAliveContract(address addr) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(addr)
        }
        return size > 0;
    }
}
