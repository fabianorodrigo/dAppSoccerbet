// SPDX-License-Identifier: MIT
pragma solidity <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract BetTokenFaucet {
    ERC20 public BetTokenERC20;
    address public BetTokenOwner;

    constructor(address _BetTokenAddress, address _BetTokenOwnerAddress)
        public
    {
        BetTokenERC20 = ERC20(_BetTokenAddress);
        BetTokenOwner = _BetTokenOwnerAddress;
    }

    function withdraw(uint256 amount) public {
        require(amount <= 1000, "Montante de saque maximo: 1000 tokens");
        // Transfere do Owner informado no construtor para quem invocou withdraw
        BetTokenERC20.transferFrom(BetTokenOwner, msg.sender, amount);
    }

    // REJEITA qualquer tentativa de enviar Ether
    // A função fallback é executada quando nenhuma das outras funções der match
    // com a assinatura informada na transação OU se nenhum dado foi passado na
    // transação e não existe uma função "receive"
    fallback() external payable {
        revert();
    }
}
