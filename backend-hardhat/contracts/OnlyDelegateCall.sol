// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts-upgradeable/utils/StorageSlotUpgradeable.sol";
import "hardhat/console.sol";

abstract contract OnlyDelegateCall {
    error NotActiveProxyError();
    error NotDelegateCall();

    /**
     * @dev Storage slot with the address of the current implementation.
     * This is the keccak-256 hash of "eip1967.proxy.implementation" subtracted by 1, and is
     * validated in the constructor.
     */
    bytes32 internal constant _IMPLEMENTATION_SLOT =
        0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;

    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable state-variable-assignment
    address private immutable __self = address(this);

    function checkDelegateCall() private view {
        if (address(this) == __self) {
            revert NotDelegateCall();
        }
    }

    /**
     * @dev Returns the current implementation address.
     */
    function _getImplementation() internal view returns (address) {
        console.log(
            StorageSlotUpgradeable.getAddressSlot(_IMPLEMENTATION_SLOT).value
        );
        return
            StorageSlotUpgradeable.getAddressSlot(_IMPLEMENTATION_SLOT).value;
    }

    modifier onlyProxy() {
        checkDelegateCall();

        // if (_getImplementation() != __self) {
        //     revert NotActiveProxyError();
        // }
        _;
    }

    modifier onlyMinimalProxy() {
        checkDelegateCall();
        _;
    }
}
