// contracts/ETC20BetToken.sol
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

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BetToken is ERC20, Ownable {
    event Received(address tokenBuyer, uint256 quantity);

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

    constructor() ERC20("Soccer Bet Token", "SBT") {}

    // sending Ether to the contract, the sender is buying tokens for betting
    receive() external payable {
        // _mint sums the second parameter to the token's totalSupply and assign the
        // new tokens to the address of the msg.sender
        _mint(msg.sender, msg.value);
        emit Received(msg.sender, msg.value);
    }

    /**
     You’ll probably want to use a decimals value of 18, just like Ether and most ERC20 token contracts in use, 
     unless you have a very special reason not to. 
     By default, ERC20 uses a value of 18 for decimals. To use a different value, you will need to override the 
     decimals() function in your contract
     */
    /*function decimals() public view virtual override returns (uint8){
        return 10;
    }*/

    function destroyContract() public onlyOwner {
        selfdestruct(payable(this.owner()));
    }
}
