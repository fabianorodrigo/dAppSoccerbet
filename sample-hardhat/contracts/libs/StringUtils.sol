// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

library StringUtils {
    /**
     * @notice Concatenate strings a and b
     * @return a concatenated with b
     */
    function concat(string memory a, string memory b)
        internal
        pure
        returns (string memory)
    {
        return string(abi.encodePacked(a, b));
    }

    /**
     * @notice Concatenate strings a and b with a space in the middle
     * @return a concatenated with b with a space between
     */
    function concatSpaced(string memory a, string memory b)
        internal
        pure
        returns (string memory)
    {
        return string(abi.encodePacked(a, " ", b));
    }

    /**
     * @notice convert an address to it's ASCII representation
     */
    function toASCIIString(address x) internal pure returns (string memory) {
        bytes memory s = new bytes(40);
        for (uint256 i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint256(uint160(x)) / (2**(8 * (19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2 * i] = char(hi);
            s[2 * i + 1] = char(lo);
        }
        return string(s);
    }

    function char(bytes1 b) private pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }
}
