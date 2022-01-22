import { ProviderRpcError } from './../../model/metamask/ProviderRpcError';
import { Contract } from 'web3-eth-contract';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { BetTokenService } from '../../contracts/bettoken.service';
import Web3 from 'web3';
import { ProviderMessage } from '../../model/metamask/ProviderMessage';
import { ChangeDetectorRef } from '@angular/core';

declare let window: any;

@Component({
  selector: 'dapp-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  accountAddress: string | null = null;

  constructor(
    private changeDetectorRefs: ChangeDetectorRef,
    private betTokenContractService: BetTokenService
  ) {}

  ngOnInit() {
    if (window.ethereum) {
      window.ethereum.on('connect', this.handleOnConnect.bind(this));
      window.ethereum.on('disconnect', this.handleOnDisconnect.bind(this));
      window.ethereum.on(
        'accountsChanged',
        this.handleOnAccountsChanged.bind(this)
      );
      window.ethereum.on('message', this.handleOnMessage);
      //Metamask Docs strongly recommend reloading the page on chain changes, unless you have good reason not to.
      window.ethereum.on('chainChanged', (_chainId: string) =>
        window.location.reload()
      );
    }
  }

  /**
   * Ask permission to connect to the Wallet (eg. Metamask) accounts
   *
   * @param event Mouse event instance
   */
  async connect(event: MouseEvent): Promise<void> {
    if (this.hasEthereumProvider()) {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        this.handleOnAccountsChanged(accounts);
      } catch (err: any) {
        console.error(err);
        if (err.code === 4001) {
          // EIP-1193 userRejectedRequest error
          // If this happens, the user rejected the connection request.
          alert(
            'You need to connect with an account in your wallet in order to make use of this Ðapp'
          );
        } else {
          console.error(err);
          alert('We had some problem connecting you wallet');
        }
      }
    }
  }

  /**
   * Show BetToken balance of an specific account
   *
   * @param accountAddress Account address to show balance
   */
  showBalance(accountAddress: string) {
    this.betTokenContractService
      .balanceOf(accountAddress)
      .subscribe((value) => {
        console.log(value);
      });
  }

  private hasEthereumProvider(): boolean {
    if (window.ethereum) {
      return true;
    }
    this.accountAddress = null;
    alert(
      `You need a wallet to connect. You can install Metamask plugin in your browser or you can use the Brave browser that has already a native wallet`
    );
    return false;
  }

  /**
   * Handles connect event
   * @param connectInfo Info with chainId connection
   */
  private handleOnConnect(connectInfo: { chainId: string }) {
    console.log('connected', connectInfo.chainId);
    this.accountAddress = window.ethereum.selectedAddress;
  }

  /**
   * Handles disconnect event. This event is emited when becomes unable to submit RPC
   * requests to any chain. In general, this will only happen due to network connectivity
   * issues or some unforeseen error.
   *
   * @param connectInfo ProviderRpcError
   */
  private handleOnDisconnect(error: any) {
    console.log('disconnected', error);
    this.accountAddress = null;
  }

  /**
   * Handles disconnect event. This event is emited when becomes unable to submit RPC
   * requests to any chain. In general, this will only happen due to network connectivity
   * issues or some unforeseen error.
   *
   * @param connectInfo ProviderRpcError
   */
  private handleOnAccountsChanged(accounts: string[]) {
    if (accounts.length > 0) {
      this.accountAddress = accounts[0];
    } else {
      this.accountAddress = null;
    }
    //Angular not rerendering in spite of changing this.accountAddress
    this.changeDetectorRefs.detectChanges();
  }

  /**
   * Handles disconnect event. This event is emited when becomes unable to submit RPC
   * requests to any chain. In general, this will only happen due to network connectivity
   * issues or some unforeseen error.
   *
   * @param connectInfo ProviderRpcError
   */
  private handleOnMessage(message: ProviderMessage) {
    console.log('Mensagem', message);
    alert(`${message.type}: ${message.data}`);
  }
}
