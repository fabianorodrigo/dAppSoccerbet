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

    function initialize() external initializer {
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
        external
        pure
        returns (uint256)
    {
        return (amount * percentage * 100) / 10000;
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
