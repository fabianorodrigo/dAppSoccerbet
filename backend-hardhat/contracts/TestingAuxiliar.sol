// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;


import "./Base.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Contract to auxiliar during tests
 *
 * @author Fabiano Nascimento
 */
contract TestingAuxiliar is Base, Ownable {
    address payable public selfDestructRecipient;

    /**
     * @notice creates a new instance of Auxiliar contract
     * @param _selfDestructRecipient The address that will receive
     * the remaining Ether after calling selfdestruct
     */
    constructor(address _selfDestructRecipient) payable nonZeroAddress(_selfDestructRecipient) {
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
    function destroyContract() external onlyOwner {
        selfdestruct(selfDestructRecipient);
    }
}
