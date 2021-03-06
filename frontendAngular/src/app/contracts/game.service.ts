import BN from 'bn.js';
import { Observable } from 'rxjs';
import { AbiItem } from 'web3-utils';
import contractABI from '../../../../backend-hardhat/artifacts/contracts/Game.sol/Game.json';
import { Bet, CallbackFunction, Game, ProviderErrors, Score } from '../model';
import { MessageService, Web3Service } from '../services';
import { TransactionResult } from './../model/transaction-result.interface';
import { BaseContract } from './baseContract';

export class GameService extends BaseContract {
  static EVENTS = {
    GAME_OPENED: 'GameOpened',
    GAME_CLOSED: 'GameClosed',
    GAME_FINALIZED: 'GameFinalized',
    BET_ON_GAME: 'BetOnGame',
    GAME_WINNERS_IDENTIFIED: `GameWinnersIdentified`,
    GAME_PRIZES_CALCULATED: `GamePrizesCalculated`,
  };

  constructor(_messageService: MessageService, _web3Service: Web3Service, _address: string) {
    super(_messageService, _web3Service, _address);
  }

  getContractABI(): AbiItem[] {
    return contractABI.abi as AbiItem[];
  }

  /**
   * Open the game for betting
   * @param _callback  Function to be called when the transaction is confirmed
   * @returns result of transaction submission
   */
  openForBetting(_callback?: CallbackFunction): Observable<TransactionResult<string>> {
    return this.send(
      contractABI.abi as AbiItem[],
      'openForBetting',
      'Transaction to open the game for betting was sent successfully',
      _callback
    );
  }

  /**
   * Close the game for betting
   * @param _callback  Function to be called when the transaction is confirmed
   * @returns result of transaction submission
   */
  closeForBetting(_callback?: CallbackFunction): Observable<TransactionResult<string>> {
    return this.send(
      contractABI.abi as AbiItem[],
      'closeForBetting',
      'Transaction to close the game for betting was sent successfully',
      _callback
    );
  }

  /**
   * Place a bet on the game
   *
   * @param _score The guessed final score of the game
   * @param _value The quantity of BetTokens bet
   * @returns result of transaction submission
   */
  bet(_score: Score, _value: BN): Observable<TransactionResult<string>> {
    return new Observable<TransactionResult<string>>((subscriber) => {
      this.getContract(contractABI.abi as AbiItem[])
        .then(async (_contract) => {
          let result;
          this._web3Service.getUserAccountAddress().subscribe(async (fromAccount) => {
            try {
              result = await _contract.methods.bet(_score, _value).send({
                from: fromAccount,
              });
              subscriber.next({
                success: true,
                result: 'Transaction to place the bet on the game was sent successfully',
              });
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
        })
        .catch((e) => {
          console.warn(`gameservice`, e);
        });
    });
  }

  /**
   * Finalize the game
   *
   * @param _game Game being finalized
   * @param _score The final score of the game
   * @param _callback  Function to be called when the transaction is confirmed
   * @returns result of transaction submission
   */
  finalizeGame(_game: Game, _score: Score, _callback?: CallbackFunction): Observable<TransactionResult<string>> {
    return this.send(
      contractABI.abi as AbiItem[],
      'finalizeGame',
      `Transaction to finalize the game ${_game.homeTeam} ${_score.home} X ${_score.visitor} ${_game.visitorTeam} was sent successfully`,
      _callback,
      `Transaction to finalize the game ${_game.homeTeam} ${_score.home} X ${_score.visitor} ${_game.visitorTeam} was confirmed`,
      _score
    );
  }

  /**
   * After game is finalized, this method identify the winner bets
   *
   * @param _game Game having its winner bets being identified
   * @param _callback  Function to be called when the transaction is confirmed
   * @returns result of transaction submission
   */
  identifyWinners(_game: Game, _callback?: CallbackFunction): Observable<TransactionResult<string>> {
    return this.send(
      contractABI.abi as AbiItem[],
      'identifyWinners',
      `Transaction to identify the game's winner bets was sent successfully`,
      _callback,
      `Transaction to identify the game's winner bets was confirmed for ${_game.homeTeam} ${_game.finalScore?.home}  x ${_game.finalScore?.visitor} ${_game.visitorTeam}`
    );
  }

  /**
   * After game's winner bets are identified, this method calc the prizes of the winner bets
   *
   * @param _game Game having the prizes being calculated
   * @param _callback  Function to be called when the transaction is confirmed
   *
   * @returns result of transaction submission
   */
  calcPrizes(
    _game: Game,
    _callback?: CallbackFunction,
    confirmationMessage?: string
  ): Observable<TransactionResult<string>> {
    return this.send(
      contractABI.abi as AbiItem[],
      'calcPrizes',
      `Transaction to calc prizes for the game's winner bets was sent successfully`,
      _callback,
      `Transaction to calc prizes for the game's winner bets was confirmed for ${_game.homeTeam} ${_game.finalScore?.home}  x ${_game.finalScore?.visitor} ${_game.visitorTeam}`
    );
  }

  /**
   * Withdraw the prize from the game to the winner bettor account
   *
   * @param _betIndex the index of Bet being withdrawn
   * @returns result of transaction submission
   */
  withdrawPrize(
    _game: Game,
    _betIndex: number,
    _callback?: CallbackFunction,
    confirmationMessage?: string
  ): Observable<TransactionResult<string>> {
    return this.send(
      contractABI.abi as AbiItem[],
      'withdrawPrize',
      `Transaction for withdraw the prize was sent successfully`,
      _callback,
      `Transaction for withdraw the prize  was confirmed`,
      _betIndex
    );
  }

  /**
   * Pause the contract of the game
   * @param _callback  Function to be called when the transaction is confirmed
   * @returns result of transaction submission
   */
  pause(_callback?: CallbackFunction): Observable<TransactionResult<string>> {
    return this.send(
      contractABI.abi as AbiItem[],
      'pause',
      'Transaction to pause the game was sent successfully',
      _callback
    );
  }

  /**
   * Unpause the contract of the game returning to it's normal state
   * @param _callback  Function to be called when the transaction is confirmed
   * @returns result of transaction submission
   */
  unpause(_callback?: CallbackFunction): Observable<TransactionResult<string>> {
    return this.send(
      contractABI.abi as AbiItem[],
      'unpause',
      'Transaction to unpause the game was sent successfully',
      _callback
    );
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
  getPrize(): Promise<BN> {
    return this.getBN(contractABI.abi as AbiItem[], 'getPrize');
  }
  winnersIdentified(): Promise<boolean> {
    return this.getBoolean(contractABI.abi as AbiItem[], `winnersIdentified`);
  }
  prizesCalculated(): Promise<boolean> {
    return this.getBoolean(contractABI.abi as AbiItem[], `prizesCalculated`);
  }
  canClose(): Promise<boolean> {
    return this.getBoolean(contractABI.abi as AbiItem[], 'canClose');
  }
  canFinalize(): Promise<boolean> {
    return this.getBoolean(contractABI.abi as AbiItem[], 'canFinalize');
  }
  paused(): Promise<boolean> {
    return this.getBoolean(contractABI.abi as AbiItem[], 'paused');
  }

  getDTO(): Observable<Game> {
    return new Observable<Game>((_subscriber) => {
      this.getContract(contractABI.abi as AbiItem[])
        .then((_contract) => {
          try {
            _contract.methods
              .getDTO()
              .call()
              .then((result: Game | undefined) => {
                _subscriber.next(result);
              })
              .catch((e: any) => {
                _subscriber.error(e);
              });
          } catch (e) {
            console.warn(e);
          }
        })
        .catch((e) => {
          console.warn(`game final`, e);
        });
    });
  }

  finalScore(): Observable<Score> {
    return new Observable<Score>((_subscriber) => {
      this.getContract(contractABI.abi as AbiItem[])
        .then((_contract) => {
          try {
            _contract.methods
              .finalScore()
              .call()
              .then((result: Score | undefined) => {
                _subscriber.next(result);
              })
              .catch((e: any) => {
                _subscriber.error(e);
              });
          } catch (e) {
            console.warn(e);
          }
        })
        .catch((e) => {
          console.warn(`gameservice final`, e);
        });
    });
  }

  listBets(): Observable<TransactionResult<Bet[]>> {
    return new Observable<TransactionResult<Bet[]>>((_subscriber) => {
      this.getContract(contractABI.abi as AbiItem[])
        .then((_contract) => {
          try {
            _contract.methods
              .listBets()
              .call()
              .then((_result: Bet[]) => {
                _subscriber.next({
                  success: true,
                  result: _result.map((b, i) => {
                    return { ...b, index: i };
                  }),
                });
              })
              .catch((e: any) => {
                _subscriber.next({ success: false, result: e.message });
              });
          } catch (e: any) {
            _subscriber.next({ success: false, result: e.message });
            console.warn(e);
          }
        })
        .catch((e) => {
          console.warn(`gameservice final`, e);
          _subscriber.next({ success: false, result: e.message });
        });
    });
  }
}
