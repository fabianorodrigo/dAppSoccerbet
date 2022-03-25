// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

abstract contract OnlyDelegateCall {
    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable state-variable-assignment
    address private immutable __self = address(this);

    function checkDelegateCall() private view {
        require(
            address(this) != __self,
            "Function must be called through delegatecall"
        );
    }

    modifier onlyDelegateCall() {
        checkDelegateCall();
        _;
    }
}
