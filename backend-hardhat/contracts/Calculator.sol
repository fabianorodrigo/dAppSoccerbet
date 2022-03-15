// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title Contract that provides Math functions
 *
 * @author Fabiano Nascimento
 */
contract CalculatorUpgradeable is
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
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

    function initialize() public initializer {
        __Ownable_init();
    }

    /**
     * @notice calculates a percentage of a amount multiplying amount * percentage * 100
     * and, then, dividing the result for 10000
     *
     * @dev The Solidity way
     *
     * @return The percentage of the amount
     */
    function calcPercentage(uint256 amount, uint256 percentage)
        public
        pure
        returns (uint256)
    {
        return (amount * percentage * 100) / 10000;
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
        require(sent, "Fail");
    }

    /**
     * Function required by UUPS proxy pattern
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}
}
