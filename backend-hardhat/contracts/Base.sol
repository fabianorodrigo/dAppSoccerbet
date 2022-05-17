// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

/// @notice Contract with generic utilities that can be inherited for any contract that needs them
abstract contract Base{
    modifier nonZeroAddress(address _address){
        require(_address != address(0),"Address must not be zero");
        _;
    }
}