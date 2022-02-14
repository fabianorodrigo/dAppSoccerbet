// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

/**
 * @title Contract to auxiliar during tests
 *
 * @author Fabiano Nascimento
 */
contract TestingAuxiliar {
    address payable public selfDestructRecipient;

    /**
     * @notice creates a new instance of Auxiliar contract
     * @param _selfDestructRecipient The address that will receive
     * the remaining Ether after calling selfdestruct
     */
    constructor(address _selfDestructRecipient) payable {
        selfDestructRecipient = payable(_selfDestructRecipient);
    }

    /**
     * @notice If neither a receive Ether nor a payable fallback function is present,
     * the contract cannot receive Ether through regular transactions and throws an exception.
     * A contract without a receive Ether function can receive Ether as a recipient of a
     * COINBASE TRANSACTION (aka miner block reward) or as a destination of a SELFDESTRUCT.
     * A contract cannot react to such Ether transfers and thus also cannot reject them.
     * This is a design choice of the EVM and Solidity cannot work around it.
     */
    function destroyContract() external {
        selfdestruct(selfDestructRecipient);
    }
}
