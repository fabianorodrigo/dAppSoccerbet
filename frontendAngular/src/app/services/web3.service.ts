import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';
import { WEB3 } from '../core/web3';
import { ProviderMessage } from '../model';

declare let window: any;

@Injectable({
  providedIn: 'root',
})
export class Web3Service {
  // functions fired when event 'gameCreated' happen
  private _accountChangedListeners: { [key: string]: Function } = {};

  constructor(@Inject(WEB3) private _web3: Web3) {
    if (this.hasEthereumProvider()) {
      //const chainId = await ethereum.request({ method: 'eth_chainId' });
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
   * Add a function to the list of listeners for WEB3 provider event 'accountChanged'
   * @param _alias Alias of the listener
   * @param _function Function that will be fired when accountChanged event be catched
   */
  addAccountChangedListener(_alias: string, _function: Function) {
    this._accountChangedListeners[_alias] = _function;
  }
  /**
   * Remove the function registered under _alias name of the list os listeners for event accountChanged
   * @param _alias Alias of the listener to be removed
   */
  removeAccountChangedListener(_alias: string) {
    delete this._accountChangedListeners[_alias];
  }

  currentAccount(): Observable<string> {
    return new Observable((_subscriber) => {
      if (this.hasEthereumProvider()) {
        window.ethereum
          .request({
            method: 'eth_requestAccounts',
          })
          .then((_accounts: any[]) => {
            _subscriber.next(
              _accounts.length > 0
                ? this.toCheckSumAddress(_accounts[0])
                : undefined
            );
          });
      }
    });
  }

  /**
   * Return an observable of the contrat based on ABIs and address informed
   *
   * @param _abis Abis of contract
   * @param _address Address of contract
   */
  getContract(_abis: AbiItem[], _address: string): Contract {
    return new this._web3.eth.Contract(_abis, _address);
  }

  /**
   * Returns the version of address with checksum (lower e upper case) as specified at EIP-55
   *
   * @param {string} _address the given HEX address
   * @return {string} The HEX address with checksum
   */
  toCheckSumAddress(_address: string): string {
    return this._web3.utils.toChecksumAddress(_address);
  }

  private hasEthereumProvider(): boolean {
    if (window.ethereum) {
      return true;
    }
    alert(
      `You need a wallet to connect. You can install Metamask plugin in your browser or you can use the Brave browser that has already a native wallet`
    );
    return false;
  }

  /**
   * Handles connect event
   * @param _connectInfo Info with chainId connection
   */
  private handleOnConnect(_connectInfo: { chainId: string }) {
    console.log('connected', _connectInfo.chainId);
  }

  /**
   * Handles disconnect event. This event is emited when becomes unable to submit RPC
   * requests to any chain. In general, this will only happen due to network connectivity
   * issues or some unforeseen error.
   *
   * @param connectInfo ProviderRpcError
   */
  private handleOnDisconnect(_error: any) {
    console.log('disconnected', _error);
    //this.accountAddress = null;
  }

  /**
   * Handles account changed event. This event is emited when the account is changed at the wallet
   *
   * @param connectInfo ProviderRpcError
   */
  private handleOnAccountsChanged(_accounts: string[]) {
    console.log('web3.service.handleOnAccountChanged', _accounts);
    Object.values(this._accountChangedListeners).forEach((_f) => {
      _f(_accounts);
    });
  }

  /**
   * Handles disconnect event. This event is emited when becomes unable to submit RPC
   * requests to any chain. In general, this will only happen due to network connectivity
   * issues or some unforeseen error.
   *
   * @param connectInfo ProviderRpcError
   */
  private handleOnMessage(_message: ProviderMessage) {
    console.log('Mensagem', _message);
  }
}
