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

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

contract BetTokenUpgradeable is
    Initializable,
    ERC20Upgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable
{
    event TokenMinted(
        address indexed tokenBuyer,
        uint256 quantity,
        uint256 contractBalance
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

    function initialize() external initializer onlyProxy {
        __ERC20_init("Soccer Bet Token", "SBT");
        __Ownable_init();
        __ReentrancyGuard_init();
        __Pausable_init();
    }

    /**
     * @notice sending Ether to the contract, the sender is buying tokens for betting
     */
    receive() external payable onlyProxy whenNotPaused {
        // _mint sums the second parameter to the token's totalSupply and assign the
        // new tokens to the address of the msg.sender
        _mint(msg.sender, msg.value);
        emit TokenMinted(msg.sender, msg.value, address(this).balance);
    }

    /**
     * @notice exchange the amount of Soccer Bet Tokens for the same quantity of Wei
     */
    function exchange4Ether(uint256 _amount) external nonReentrant onlyProxy whenNotPaused {
        //_burn already has require validating account balance, account not being 0x0 ...
        _burn(msg.sender, _amount);
        // If gas costs are subject to change, then smart contracts can’t
        // depend on any particular gas costs. Any smart contract that uses
        // transfer() or send() is taking a hard dependency on gas costs by
        // forwarding a fixed amount of gas: 2300.
        //
        // Call returns a boolean value indicating success or failure.
        // This is the current recommended method to use
        (bool sent, ) = msg.sender.call{value: _amount}("");
        require(sent, "Fail");
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

    function destroyContract() external onlyProxy onlyOwner whenNotPaused{
        // If gas costs are subject to change, then smart contracts can’t
        // depend on any particular gas costs. Any smart contract that uses
        // transfer() or send() is taking a hard dependency on gas costs by
        // forwarding a fixed amount of gas: 2300.
        //
        // Call returns a boolean value indicating success or failure.
        // This is the current recommended method to use
        (bool sent, ) = owner().call{value: address(this).balance}("");
        require(sent, "Fail");
    }

    /**
     * @dev Triggers stopped state.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     * - msg.sender has to be the owner
     */
    function pause() external onlyOwner {
        _pause();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}
}
