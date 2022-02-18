import BN from 'bn.js';
import { BehaviorSubject, Observable } from 'rxjs';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';
import { ProviderErrors } from '../model';
import { MessageService, Web3Service } from '../services';
import { TransactionResult } from './../model/transaction-result.interface';

export abstract class BaseContract {
  protected contract!: Contract;
  protected _eventListeners: { [event: string]: BehaviorSubject<any> } = {};
  private _owner!: string;

  public address: string;

  constructor(
    protected _messageService: MessageService,
    protected _web3Service: Web3Service,
    _address: string
  ) {
    this.address = _address;
  }

  protected async getContract(_abis: AbiItem[]): Promise<Contract> {
    /*if (this.contract != null) {
      return this.contract;
    } else if (this._web3Service) {
      return this._web3Service.getContract(_abis, this.address);
    } else {
      throw new Error(`Web3 not instanciated`);
    }*/
    if (this.contract != null) {
      return this.contract;
    } else if (this._web3Service) {
      const _contract = await this._web3Service.getContract(
        _abis,
        this.address
      );
      if (_contract == null) {
        throw new Error(
          `Contract not found. Confirm that your wallet is connected on the right chain`
        );
      } else {
        return _contract;
      }
    }
    throw new Error(`Web3 not instanciated`);
  }

  /**
   * Returns the contract ABI
   */
  abstract getContractABI(): AbiItem[];

  /**
   * @returns The owner of contract
   */
  owner(): Observable<string> {
    //TODO: retornar Promise ao invés de Observable?
    return new Observable<string>((_subscriber) => {
      if (this._owner) {
        _subscriber.next(this._owner);
      } else {
        this.getString(this.getContractABI(), 'owner').then((_address) => {
          this._owner = _address;
          _subscriber.next(this._owner);
        });
      }
    });
  }

  /**
   * @returns returns TRUE if the wallet address is equal to the contract owner
   */
  isAdmin(): Observable<boolean> {
    return new Observable<boolean>((_subscriber) => {
      this.owner().subscribe((_ownerAddress) => {
        this._web3Service.getUserAccountAddress().subscribe((_userAddress) => {
          _subscriber.next(_ownerAddress === _userAddress);
        });
      });
    });
  }

  /**
   * If already exists an BehaviorSubject associated to the event {_eventName} and {_filter}, returns it
   * Otherwise, instances a BehaviorSubject associated to the event and returns it
   *
   * @param _eventName Name of the event which BehaviorSubject will be associated
   * @param _filter a optional object of type Key:Value that is used to filter events
   * @returns Promise of instance of BehaviorSubject associated with the event {_eventName}
   */
  async getEventBehaviorSubject(
    _eventName: string,
    _filter?: { [key: string]: any }
  ): Promise<BehaviorSubject<any>> {
    const _contract = await this.getContract(this.getContractABI());
    if (!this._eventListeners[_eventName]) {
      const _key = this._validateEventAndInstanceSubject(
        _contract,
        _eventName,
        _filter
      );
      _contract.events[_eventName](_filter ? { filter: _filter } : undefined)
        .on('data', (event: any) => {
          if (this._eventListeners[_key]) {
            this._eventListeners[_key].next(event.returnValues);
          }
        })
        .on('error', (e: any) => {
          console.error(_eventName, e);
          //throw e;
        });
    }
    return this._eventListeners[_eventName];
  }

  /**
   * Check if {_contract} has a event named {_eventName}. If not, throws an exception
   * If exists, create a instance of BehaviorSubject at this._eventListeners[_eventName]
   *
   * @param _contract Contract evaluated
   * @param _eventName Name of the event
   * @param _filter Optional filter that may be used as index along with _eventName
   *
   * @returns The key of BehaviorSubject
   */
  private _validateEventAndInstanceSubject(
    _contract: Contract,
    _eventName: string,
    _filter?: { [key: string]: any }
  ): string {
    if (!_contract.events[_eventName]) {
      throw new Error(`Event '${_eventName}' does not exists in the contract`);
    } else {
      const _key = _filter
        ? _eventName.concat(JSON.stringify(_filter))
        : _eventName;
      this._eventListeners[_key] = new BehaviorSubject<any>(null);
      return _key;
    }
  }

  /**
   * Execute a SEND (change state) to a function without input parameter
   * and without return from the currentAccount selected on the wallet provider
   *
   * @param _abi  Contract's ABI
   * @param _functionName Name of contract's function to be invoked
   * @param _successMessage Message to be sent in the Observable in case of successfully execution
   * @returns Observable<TransactionResult>
   */
  protected sendParamlessVoidFunction(
    _abi: AbiItem[],
    _functionName: string,
    _successMessage: string
  ): Observable<TransactionResult<string>> {
    return new Observable<TransactionResult<string>>((subscriber) => {
      this.getContract(_abi as AbiItem[]).then((_contract) => {
        let result;
        this._web3Service
          .getUserAccountAddress()
          .subscribe(async (fromAccount) => {
            try {
              result = await _contract.methods[_functionName]().send({
                from: fromAccount,
              });
              subscriber.next({ success: true, result: _successMessage });
            } catch (e: any) {
              const providerError = ProviderErrors[e.code];
              let message = `We had some problem. The transaction wasn't sent.`;
              if (providerError) {
                message = `${providerError.title}: ${providerError.message}. The transaction wasn't sent.`;
              }
              console.warn(e);
              subscriber.next({ success: false, result: message });
            }
          });
      });
    });
  }

  /**
   * Calls the GET function of the contract with the name {_propertyName}
   * @param _abi Contract's ABI
   * @param _propertyName name of the property of type string
   */
  protected getString(_abi: AbiItem[], _propertyName: string): Promise<string> {
    return this.getProperty(_abi, _propertyName);
  }

  /**
   * Calls the GET function of the contract with the name {_propertyName}
   * @param _abi Contract's ABI
   * @param _propertyName name of the property of type string[]
   */
  protected getStringArray(
    _abi: AbiItem[],
    _propertyName: string
  ): Promise<string[]> {
    return this.getProperty(_abi, _propertyName);
  }

  /**
   * Calls the GET function of the contract with the name {_propertyName}
   * @param _abi Contract's ABI
   * @param _propertyName name of the property of type boolean
   */
  protected async getBoolean(
    _abi: AbiItem[],
    _propertyName: string
  ): Promise<boolean> {
    return this.getProperty(_abi, _propertyName);
  }

  /**
   * Calls the GET function of the contract with the name {_propertyName}
   * @param _propertyName name of the property of type number
   */
  protected getNumber(_abi: AbiItem[], _propertyName: string): Promise<number> {
    return this.getProperty(_abi, _propertyName);
  }

  /**
   * Calls the GET function of the contract with the name {_propertyName}
   * @param _propertyName name of the property of type BN (BigNumber)
   */
  protected getBN(_abi: AbiItem[], _propertyName: string): Promise<BN> {
    return this.getProperty(_abi, _propertyName);
  }

  /**
   * Calls the GET function of the contract with the name {_propertyName}
   *
   * @param _abi Contract's ABI
   * @param _propertyName name of the property of type string
   * @param _subscriber Instance of the subscriber that will receive the result
   */
  protected async getProperty(
    _abi: AbiItem[],
    _propertyName: string
  ): Promise<any> {
    try {
      const _contract = await this.getContract(_abi);
      const _result = await _contract.methods[_propertyName]().call();
      return _result;
    } catch (e: any) {
      this._messageService.show(e.message);
    }
  }
}
