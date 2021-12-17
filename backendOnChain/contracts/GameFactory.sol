// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./BetToken.sol";
import "./Game.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GameFactory is Ownable {
    // BetToken contract address
    address private _betTokenContractAddress;
    // All games open for betting
    Game[] private _gamesOpen;
    // All games closed for betting
    Game[] private _gamesClosed;
    // All games finished
    Game[] private _gamesFinished;

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
    ) public onlyOwner returns (Game) {
        // a game starts closed for betting
        Game g = new Game(
            house_,
            visitor_,
            datetimeGame_,
            _betTokenContractAddress
        );
        _gamesClosed.push(g);
        return _gamesClosed[_gamesClosed.length - 1];
    }

    /**
     * Return all games open for betting
     */
    function listOpenGames() public view returns (Game[] memory openGames) {
        return _gamesOpen;
    }

    /**
     * Return all games closed for betting
     */
    function listClosedGames() public view returns (Game[] memory closedGames) {
        return _gamesClosed;
    }

    /**
     * Return all games finished
     */
    function listFinishedGames()
        public
        view
        returns (Game[] memory finishedGames)
    {
        return _gamesFinished;
    }

    /**
     * Open a specific game for bettings
     * @param closeGameIndex the index of the game to be opened in the closed games array
     */
    function openGameForBetting(uint256 closeGameIndex) public onlyOwner {
        require(
            closeGameIndex > _gamesClosed.length,
            "Game not found in the closed games list"
        );
        // get the reference to the Game of the index
        Game g = _gamesClosed[closeGameIndex];
        // it can't be already finalized
        require(g.getFinalized() == false, "Game already finalized");
        // set it's "open" attribute
        g.openForBetting();
        // removes it from closed list
        delete _gamesClosed[closeGameIndex];
        // push it in the opened list
        _gamesOpen.push(g);
    }

    /**
     * Close a specific game for bettings
     *
     * @param openGameIndex the index of the game to be closed in the opened games array
     */
    function closeGameForBetting(uint256 openGameIndex) public onlyOwner {
        require(
            openGameIndex > _gamesOpen.length,
            "Game not found in the opened games list"
        );
        // get the reference to the Game of the index
        Game g = _gamesOpen[openGameIndex];
        // set it's "open" attribute
        g.closeForBetting();
        // removes it from opened list
        delete _gamesOpen[openGameIndex];
        // push it in the closed list
        _gamesClosed.push(g);
    }

    /**
     * Finishes the game registering the final score
     *
     * @param closedGameIndex Index of the game to be edited in the _gamesClosed list
     * @param finalScore_ Data of the final score of the match
     */
    function finishGame(uint256 closedGameIndex, Score memory finalScore_)
        public
        onlyOwner
    {
        require(
            closedGameIndex > _gamesClosed.length,
            "Game not found in the closed games list"
        );
        // get the reference to the Game of the index
        Game g = _gamesClosed[closedGameIndex];
        g.finishGame(finalScore_);
        //removes the game from closed for betting list
        delete _gamesClosed[closedGameIndex];
        // pusht it to the finished list
        _gamesFinished.push(g);
    }

    /**
     * Alllows edit the score of a finished game just in case something was wrong
     * @param finishedGameIndex Index of the game to be edited in the _gamesFinished list
     * @param finalScore_ Data of the final score of the match
     */
    function editFinishedGameScore(
        uint256 finishedGameIndex,
        Score memory finalScore_
    ) public onlyOwner {
        require(
            finishedGameIndex > _gamesFinished.length,
            "Game not found in the finished games list"
        );
        // get the reference to the Game of the index
        Game g = _gamesFinished[finishedGameIndex];
        g.editFinishedGameScore(finalScore_);
    }

    /**
     * Destroy a specific Game contract if it's been finished already
     *
     * @param finishedGameIndex Index of the game to be edited in the _gamesFinished list
     */
    function destroyGameContract(uint256 finishedGameIndex) public onlyOwner {
        require(
            finishedGameIndex > _gamesFinished.length,
            "Game not found in the finished games list"
        );
        // get the reference to the Game of the index
        Game g = _gamesFinished[finishedGameIndex];
        g.destroyContract();
    }

    function destroyContract() public onlyOwner {
        // since the owner of Games contracts is this contract, it's necessary to destroy all of them before destroy the Factory
        for (uint256 i = 0; i < _gamesFinished.length; i++) {
            if (isAliveContract(address(_gamesFinished[i]))) {
                _gamesFinished[i].destroyContract();
            }
        }
        for (uint256 i = 0; i < _gamesClosed.length; i++) {
            if (isAliveContract(address(_gamesClosed[i]))) {
                _gamesClosed[i].destroyContract();
            }
        }
        for (uint256 i = 0; i < _gamesOpen.length; i++) {
            if (isAliveContract(address(_gamesOpen[i]))) {
                _gamesOpen[i].destroyContract();
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
