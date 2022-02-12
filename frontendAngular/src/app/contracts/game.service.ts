import { Observable } from 'rxjs';
import { AbiItem } from 'web3-utils';
import contractABI from '../../../../backendOnChain/build/contracts/Game.json';
import { Bet, ProviderErrors, Score } from '../model';
import { MessageService, Web3Service } from '../services';
import { TransactionResult } from './../model/transaction-result.interface';
import { BaseContract } from './baseContract';

export class GameService extends BaseContract {
  static EVENTS = {
    GAME_OPENED: 'GameOpened',
    GAME_CLOSED: 'GameClosed',
    GAME_FINALIZED: 'GameFinalized',
  };

  constructor(
    _messageService: MessageService,
    _web3Service: Web3Service,
    _address: string
  ) {
    super(_messageService, _web3Service, _address);
  }

  getContractABI(): AbiItem[] {
    return contractABI.abi as AbiItem[];
  }

  /**
   * Open the game for betting
   * @returns result of transaction submission
   */
  openForBetting(): Observable<TransactionResult> {
    return this.sendParamlessVoidFunction(
      contractABI.abi as AbiItem[],
      'openForBetting',
      'Transaction to open the game for betting was sent successfully'
    );
  }

  /**
   * Close the game for betting
   * @returns result of transaction submission
   */
  closeForBetting(): Observable<TransactionResult> {
    return this.sendParamlessVoidFunction(
      contractABI.abi as AbiItem[],
      'closeForBetting',
      'Transaction to close the game for betting was sent successfully'
    );
  }

  /**
   * Place a bet on the game
   *
   * @param _score The guessed final score of the game
   * @param _value The quantity of BetTokens bet
   * @returns result of transaction submission
   */
  bet(_score: Score, _value: number): Observable<TransactionResult> {
    return new Observable<TransactionResult>((subscriber) => {
      this.getContract(contractABI.abi as AbiItem[])
        .then(async (_contract) => {
          let result;
          this._web3Service
            .getUserAccountAddress()
            .subscribe(async (fromAccount) => {
              try {
                result = await _contract.methods.bet(_score, _value).send({
                  from: fromAccount,
                });
                subscriber.next({
                  success: true,
                  message:
                    'Transaction to place the bet on the game was sent successfully',
                });
              } catch (e: any) {
                const providerError = ProviderErrors[e.code];
                let message = `We had some problem. The transaction wasn't sent.`;
                if (providerError) {
                  message = `${providerError.title}: ${providerError.message}. The transaction wasn't sent.`;
                }
                console.warn(e);
                subscriber.next({ success: false, message: message });
              }
            });
        })
        .catch((e) => {
          console.warn(`gameservice`, e);
        });
    });
  }

  /**
   * Finalize the game
   * @param _score The final score of the game
   * @returns result of transaction submission
   */
  finalizeGame(_score: Score): Observable<TransactionResult> {
    return new Observable<TransactionResult>((subscriber) => {
      this.getContract(contractABI.abi as AbiItem[])
        .then(async (_contract) => {
          let result;
          this._web3Service
            .getUserAccountAddress()
            .subscribe(async (fromAccount) => {
              try {
                result = await _contract.methods.finalizeGame(_score).send({
                  from: fromAccount,
                });
                subscriber.next({
                  success: true,
                  message:
                    'Transaction to finalize the game for betting was sent successfully',
                });
              } catch (e: any) {
                const providerError = ProviderErrors[e.code];
                let message = `We had some problem. The transaction wasn't sent.`;
                if (providerError) {
                  message = `${providerError.title}: ${providerError.message}. The transaction wasn't sent.`;
                }
                console.warn(e);
                subscriber.next({ success: false, message: message });
              }
            });
        })
        .catch((e) => {
          console.warn(`bettoken`, e);
        });
    });
  }

  homeTeam(): Promise<string> {
    return this.getString(contractABI.abi as AbiItem[], 'homeTeam');
  }
  visitorTeam(): Promise<string> {
    return this.getString(contractABI.abi as AbiItem[], 'visitorTeam');
  }
  datetimeGame(): Promise<number> {
    return this.getNumber(contractABI.abi as AbiItem[], 'datetimeGame');
  }
  open(): Promise<boolean> {
    return this.getBoolean(contractABI.abi as AbiItem[], 'open');
  }
  finalized(): Promise<boolean> {
    return this.getBoolean(contractABI.abi as AbiItem[], 'finalized');
  }

  finalScore(): Observable<Score> {
    return new Observable<Score>((_subscriber) => {
      this.getContract(contractABI.abi as AbiItem[])
        .then((_contract) => {
          let result;
          try {
            _contract.methods
              .finalScore()
              .call()
              .then((result: Score | undefined) => {
                _subscriber.next(result);
              })
              .catch((e: any) => {
                _subscriber.next(undefined);
              });
          } catch (e) {
            console.warn(e);
          }
          _subscriber.next(result);
        })
        .catch((e) => {
          console.warn(`gameservice final`, e);
        });
    });
  }
}
