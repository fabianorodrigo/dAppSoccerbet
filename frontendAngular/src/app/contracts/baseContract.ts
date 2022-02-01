import { Observable } from 'rxjs';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';
import { Web3Service } from '../services';

export class BaseContract {
  protected contract!: Contract;
  protected _eventListeners: { [key: string]: { [key: string]: Function } } =
    {};

  public address: string;

  constructor(protected _web3Service: Web3Service, _address: string) {
    this.address = _address;
  }

  protected getContract(_abis: AbiItem[]): Observable<Contract> {
    return new Observable((_subscriber) => {
      if (this.contract != null) {
        _subscriber.next(this.contract);
      } else if (this._web3Service) {
        _subscriber.next(this._web3Service.getContract(_abis, this.address));
      } else {
        throw new Error(`Web3 not instanciated`);
      }
    });
  }

  /**
   * Calls the GET function of the contract with the name {_propertyName}
   * @param _propertyName name of the property of type string
   */
  protected getString(
    _abi: AbiItem[],
    _propertyName: string
  ): Observable<string> {
    return new Observable<string>((_subscriber) => {
      this.getContract(_abi).subscribe(async (_contract) => {
        let result;
        try {
          result = await _contract.methods[_propertyName]().call();
        } catch (e) {
          console.warn(e);
        }
        _subscriber.next(result);
      });
    });
  }

  /**
   * Calls the GET function of the contract with the name {_propertyName}
   * @param _propertyName name of the property of type boolean
   */
  protected getBoolean(
    _abi: AbiItem[],
    _propertyName: string
  ): Observable<boolean> {
    return new Observable<boolean>((_subscriber) => {
      this.getContract(_abi).subscribe(async (_contract) => {
        let result;
        try {
          result = await _contract.methods[_propertyName]().call();
        } catch (e) {
          console.warn(e);
        }
        _subscriber.next(result);
      });
    });
  }

  /**
   * Calls the GET function of the contract with the name {_propertyName}
   * @param _propertyName name of the property of type number
   */
  protected getNumber(
    _abi: AbiItem[],
    _propertyName: string
  ): Observable<number> {
    return new Observable<number>((_subscriber) => {
      this.getContract(_abi).subscribe(async (_contract) => {
        let result;
        try {
          result = await _contract.methods[_propertyName]().call();
        } catch (e) {
          console.warn(e);
        }
        _subscriber.next(result);
      });
    });
  }

  /**
   * Initialize the monitoring of the events specified in {_evenNames} of {_contract}
   *
   * @param _contract Contract that will have a function attached on it's events
   * @param _eventNames Name of events of Contract to be monitored
   */
  protected initEventListeners(_contract: Contract, _eventNames: string[]) {
    _eventNames.forEach((_eventName) => {
      if (!_contract.events[_eventName]) {
        throw new Error(
          `Event '${_eventName}' does not exists in the contract`
        );
      }
      _contract.events[_eventName]()
        .on('data', (event: any) => {
          Object.values(this._eventListeners[_eventName]).forEach((_f) => {
            _f(event.returnValues);
          });
        })
        .on('error', console.error);
    });
  }

  /**
   * Add a function to the list of listeners for event _eventName
   * @param _eventName Name of event to which the listener is being added
   * @param _listenerAlias Alias of the listener
   * @param _function Function that will be fired when GameOpened event be catched
   */
  addEventListener(
    _eventName: string,
    _listenerAlias: string,
    _function: Function
  ) {
    if (!this._eventListeners[_eventName]) {
      this._eventListeners[_eventName] = {};
    }
    this._eventListeners[_eventName][_listenerAlias] = _function;
  }

  /**
   * Remove the function registered under _alias name of the list os listeners for event _eventName
   * @param _eventName Name of event to which the listener is being removed
   * @param _listenerAlias Alias of the listener to be removed
   */
  removeEventListener(_eventName: string, _listenerAlias: string) {
    delete this._eventListeners[_eventName][_listenerAlias];
  }
}
