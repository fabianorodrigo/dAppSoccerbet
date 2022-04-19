import { Inject, Injectable } from '@angular/core';
import detectEthereumProvider from '@metamask/detect-provider';
import * as BN from 'bn.js';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';
import { WEB3 } from '../core/web3';
import { ProviderMessage, TransactionResult } from '../model';

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

  private _chainId!: string;

  constructor(@Inject(WEB3) private _web3: Web3) {
    this.hasEthereumProvider();
  }

  public get chaindId() {
    return this._chainId;
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
    window.ethereum
      .request({
        method: 'eth_requestAccounts',
      })
      .then(this.handleOnAccountsChanged.bind(this));
    /*.catch((err: ProviderRpcError) => {
        if (err.code === 4001) {
          // EIP-1193 userRejectedRequest error
          // If this happens, the user rejected the connection request.
          console.log('Please connect to MetaMask.');
        } else {
          console.error(err);
        }
      });*/
  }

  /**
   * Gets the balance of the {_accountAddress} in the official currency of chain in use (ex. Ether in case of Ethereum)
   *
   * @param _accountAddress The account address which balance is wanted
   * @returns The string value in Wei
   */
  chainCurrencyBalanceOf(_accountAddress: string): Observable<string> {
    return new Observable<string>((_subscriber) => {
      this._web3.eth
        .getBalance(_accountAddress)
        .then((_balance) => {
          _subscriber.next(_balance);
        })
        .catch((e) => {
          console.warn(`web3Service`, e);
        });
    });
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
  sendWei(_addressFrom: string, _addressTo: string, _valueInWei: BN): Observable<TransactionResult<string>> {
    return new Observable<TransactionResult<string>>((_subscriber) => {
      if (window.ethereum) {
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
            _subscriber.next({ success: true, result: _transaction });
          })
          .catch((e: { message: any }) => {
            _subscriber.next({ success: false, result: e.message });
          });
      } else {
        _subscriber.next({
          success: false,
          result: `You need a wallet to connect. You can install Metamask plugin in your browser or you can use the Brave browser that has already a native wallet`,
        });
      }
    });
  }

  async addTokenToWallet(): Promise<boolean> {
    const tokenAddress = environment.betTokenAddress;
    const tokenSymbol = 'BET';
    const tokenDecimals = 18;
    const tokenImage = 'https://cdn.iconscout.com/icon/premium/png-256-thumb/football-betting-2018363-1716872.png';

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

    return false;
  }

  /**
   * Return the contrat based on ABIs and address informed
   *
   * @param _abis Abis of contract
   * @param _address Address of contract
   */
  async getContract(_abis: AbiItem[], _address: string): Promise<Contract | null> {
    if ((await this._web3.eth.getCode(_address)) === '0x') {
      console.error(`Address ${_address} is not a contract at the connected chain`);
      return null;
    }
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

  getCurrentBlockNumber(): Promise<number> {
    return this._web3.eth.getBlockNumber();
  }

  private async hasEthereumProvider(): Promise<boolean> {
    // this returns the provider, or null if it wasn't detected
    const provider = await detectEthereumProvider();
    if (provider) {
      // If the provider returned by detectEthereumProvider is not the same as
      // window.ethereum, something is overwriting it, perhaps another wallet.
      if (provider !== window.ethereum) {
        alert('Do you have multiple wallets installed?');
      } else {
        this._chainId = await window.ethereum.request({
          method: 'eth_chainId',
        });
        window.ethereum.on('connect', this.handleOnConnect.bind(this));
        window.ethereum.on('disconnect', this.handleOnDisconnect.bind(this));
        window.ethereum.on('accountsChanged', this.handleOnAccountsChanged.bind(this));
        window.ethereum.on('message', this.handleOnMessage);
        //Metamask Docs strongly recommend reloading the page on chain changes, unless you have good reason not to.
        window.ethereum.on('chainChanged', (_chainId: string) => window.location.reload());
        return true;
      }
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
    this._userAccountAddress = _accounts.length > 0 ? this.toCheckSumAddress(_accounts[0]) : null;
    this._userAccountAddressSubject.next(this._userAccountAddress);
  }

  /**
   * The MetaMask provider emits this event when it receives
   * some message that the consumer should be notified of. The
   * kind of message is identified by the type string.
   *
   * @param _message ProviderMessage
   */
  private handleOnMessage(_message: ProviderMessage) {
    console.log('Mensagem', _message);
  }
}
