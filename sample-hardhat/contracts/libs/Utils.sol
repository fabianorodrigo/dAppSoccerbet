// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

library Utils {
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
