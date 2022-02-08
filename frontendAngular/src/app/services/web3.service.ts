import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';
import { WEB3 } from '../core/web3';
import { ProviderMessage, TransactionResult } from '../model';
import * as BN from 'bn.js';

declare let window: any;

@Injectable({
  providedIn: 'root',
})
export class Web3Service {
  /**
   * Subject to handle the current user account address and it's changes
   */
  private _userAccountAddressSubject = new BehaviorSubject<string | null>(null);
  private _userAccountAddress!: string | null;

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
   * @returns Observable to monitor changes in the user account address in the wallet
   */
  getUserAccountAddressSubject() {
    return this._userAccountAddressSubject.asObservable();
  }

  /**
   * @returns The current user account address in the provider (wallet)
   */
  getUserAccountAddress(): Observable<string | null> {
    return new Observable((_subscriber) => {
      if (this._userAccountAddress) {
        _subscriber.next(this._userAccountAddress);
      } else {
        this._userAccountAddressSubject.subscribe((_address) => {
          _subscriber.next(_address);
        });
        this.fetchCurrentAccount();
      }
    });
  }

  /**
   * Request accounts to the provider (wallet) and triggers the {userAccountAddressSubject} when done
   */
  fetchCurrentAccount(): void {
    if (this.hasEthereumProvider()) {
      window.ethereum
        .request({
          method: 'eth_requestAccounts',
        })
        .then((_accounts: any[]) => {
          this._userAccountAddress =
            _accounts.length > 0 ? this.toCheckSumAddress(_accounts[0]) : null;
          this._userAccountAddressSubject.next(this._userAccountAddress);
        });
    }
  }

  /**
   * Send Ether a {_value} from account {_addressFrom} to account {_addressTo}
   *
   * @param _addressFrom origin of funds
   * @param _addressTo destination of funds
   * @param _valueInWei Value in Wei
   *
   * @returns a TransactionResult that indicates if successful or not and message
   */
  sendWei(
    _addressFrom: string,
    _addressTo: string,
    _valueInWei: BN
  ): Observable<TransactionResult> {
    return new Observable<TransactionResult>((_subscriber) => {
      if (this.hasEthereumProvider()) {
        const weiAmmountHEX = this._web3.utils.toHex(_valueInWei);
        window.ethereum
          .request({
            method: 'eth_sendTransaction',
            params: [
              {
                from: _addressFrom,
                to: _addressTo,
                value: weiAmmountHEX,
                /*gasPrice: '0x09184e72a000',
                gas: '0x2710',*/
              },
            ],
          })
          .then((_transaction: any) => {
            _subscriber.next({ success: true, message: _transaction });
          })
          .catch((e: { message: any }) => {
            _subscriber.next({ success: false, message: e.message });
          });
      } else {
        _subscriber.next({
          success: false,
          message: `You need a wallet to connect. You can install Metamask plugin in your browser or you can use the Brave browser that has already a native wallet`,
        });
      }
    });
  }

  async addTokenToWallet(): Promise<boolean> {
    const tokenAddress = environment.betTokenAddress;
    const tokenSymbol = 'BET';
    const tokenDecimals = 18;
    const tokenImage =
      'https://cdn.iconscout.com/icon/premium/png-256-thumb/football-betting-2018363-1716872.png';

    if (this.hasEthereumProvider()) {
      try {
        // wasAdded is a boolean. Like any RPC method, an error may be thrown.
        return await window.ethereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20', // Initially only supports ERC20, but eventually more!
            options: {
              address: tokenAddress, // The address that the token is at.
              symbol: tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
              decimals: tokenDecimals, // The number of decimals in the token
              image: tokenImage, // A string url of the token logo
            },
          },
        });
      } catch (error) {
        console.log(error);
      }
    }
    return false;
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
    this._userAccountAddress =
      _accounts.length > 0 ? this.toCheckSumAddress(_accounts[0]) : null;
    this._userAccountAddressSubject.next(this._userAccountAddress);
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
