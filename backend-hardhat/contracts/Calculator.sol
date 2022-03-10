// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

/**
 * @title Contract that provides Math functions
 *
 * @author Fabiano Nascimento
 */
contract CalculatorUpgradeable {
    event Debug(string msg, uint256 value);

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
        //return mulDiv(amount, percentage * 100, 10000);
        return (amount * percentage * 100) / 10000;
    }

    /**
     * @notice Calculates x*y/z prevent overflow. TODO: not working on Solidity 0.8.x. Review
     * @dev https://medium.com/coinmonks/math-in-solidity-part-3-percents-and-proportions-4db014e080b1 (adapted to Solidity 0.8.x)
     *
     */
    function mulDiv(
        uint256 x,
        uint256 y,
        uint256 z
    ) public pure returns (uint256) {
        (uint256 l, uint256 h) = fullMul(x, y);
        require(h < z);
        unchecked {
            uint256 mm = mulmod(x, y, z);
            if (mm > l) h -= 1;
            l -= mm;
            uint256 pow2 = z & (type(uint256).max - z + 1);
            z /= pow2;
            l /= pow2;
            l += h * ((type(uint256).max - pow2 + 1) / pow2 + 1);
            uint256 r = 1;
            r *= 2 - z * r;
            r *= 2 - z * r;
            r *= 2 - z * r;
            r *= 2 - z * r;
            r *= 2 - z * r;
            r *= 2 - z * r;
            r *= 2 - z * r;
            r *= 2 - z * r;
            return l * r;
        }
    }

    /**
     * @notice Multiplies two 256-bit unsigned integers and returns the result as 512-bit
     * @dev https://medium.com/coinmonks/math-in-solidity-part-3-percents-and-proportions-4db014e080b1 (adapted to Solidty 0.8.x)
     */
    function fullMul(uint256 x, uint256 y)
        public
        pure
        returns (uint256 l, uint256 h)
    {
        // emit Debug("x", x);
        // emit Debug("y", y);
        // emit Debug("type(uint256).max", type(uint256).max);
        uint256 mm = mulmod(x, y, type(uint256).max);
        // emit Debug("mm", mm);
        unchecked {
            l = x * y;
            h = mm - l;

            // emit Debug("l", l);
            // emit Debug("h", h);
            if (mm < l) h -= 1;
            // emit Debug("final h", h);
        }
    }
}
