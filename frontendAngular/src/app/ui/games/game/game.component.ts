import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Bet, BetResult, BetTokenApproval, GameBetEvent, GameEvent, Score, TransactionResult } from 'src/app/model';
import { MessageService, NumbersService, Web3Service } from 'src/app/services';
import { BetDialogComponent } from '../bet-dialog/bet-dialog.component';
import { ScoreDialogComponent } from '../score-dialog/score-dialog.component';
import { GameCompound } from '../game-compound.class';
import { BuyDialogComponent } from '../../bettoken/buy-dialog/buy-dialog.component';
import { BetTokenService, GameService } from 'src/app/contracts';
import BN from 'bn.js';
import { GameBetsDialogComponent } from '../game-bets-dialog/game-bets-dialog.component';
import { GameWinnersDialogComponent } from '../game-winners-dialog/game-winners-dialog.component';
import { GameInfoDialogComponent } from '../game-info-dialog/game-info-dialog.component';

@Component({
  selector: 'dapp-games-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'],
})
export class GameComponent implements OnInit {
  @Input()
  gameCompound!: GameCompound;
  @Input()
  isAdmin: boolean = false;
  canClose: boolean = false;
  canFinalize: boolean = false;
  owner: string = '';

  userAccountAddress: string | null = null;

  // just control of the `loading` visual behavior
  currentAction = Action.NONE;
  loading: boolean = false;

  homeTeam!: string;
  visitorTeam!: string;
  datetimeGame!: Date;
  open!: boolean;
  finalized!: boolean;
  finalScore!: Score | undefined;
  winnersIdentified!: boolean;
  prizesCalculated!: boolean;

  formatedRemainingAllowance!: string | null;

  constructor(
    private _changeDetectorRefs: ChangeDetectorRef,
    private _web3Service: Web3Service,
    private _betTokenService: BetTokenService,
    private _messageService: MessageService,
    private _numberService: NumbersService,
    private _dialog: MatDialog
  ) {}

  async ngOnInit(): Promise<void> {
    this.homeTeam = this.gameCompound.game.homeTeam;
    this.visitorTeam = this.gameCompound.game.visitorTeam;
    this.datetimeGame = new Date(this._numberService.convertTimeChainToJS(this.gameCompound.game.datetimeGame));
    this.open = this.gameCompound.game.open;
    this.finalized = this.gameCompound.game.finalized;
    this.finalScore = this.gameCompound.game.finalScore;
    this.winnersIdentified = this.gameCompound.game.winnersIdentified;
    this.prizesCalculated = this.gameCompound.game.prizesCalculated;

    this.owner = this.gameCompound.game.owner as string;

    // Subscribing for account address changes in the provider
    this._web3Service.getUserAccountAddressSubject().subscribe(async (address) => {
      this.userAccountAddress = address;
      // when account changes, load the condition of current account be able to close or finalize the game
      this.canClose = await this.gameCompound.gameService.canClose();
      this.canFinalize = await this.gameCompound.gameService.canFinalize();
      this._changeDetectorRefs.detectChanges();
    });

    //events monitoring
    try {
      //bettoken approve for game contract
      (
        await this._betTokenService.getEventBehaviorSubject({
          eventName: BetTokenService.EVENTS.APPROVAL,
          filter: {
            owner: this.userAccountAddress,
            spender: this.gameCompound.game.addressGame,
          },
        })
      ).subscribe((evt) => {
        if (evt == null) return;
        const eventData: BetTokenApproval = evt;
        this.formatedRemainingAllowance = this._numberService.formatBNShortScale(eventData.value);
      });

      //bet on game
      (
        await this.gameCompound.gameService.getEventBehaviorSubject({
          eventName: GameService.EVENTS.BET_ON_GAME,
          filter: {
            addressBettor: this.userAccountAddress,
          },
        })
      ).subscribe((evt) => {
        if (evt == null) return;
        const eventData: GameBetEvent = evt;
        this.showAllowance();
      });

      //winner identified
      (
        await this.gameCompound.gameService.getEventBehaviorSubject({
          eventName: GameService.EVENTS.GAME_WINNERS_IDENTIFIED,
        })
      ).subscribe((evt) => {
        if (evt == null) return;
        const eventData: GameEvent = evt;
        this.gameCompound.game.winnersIdentified = true;
        this.winnersIdentified = true;
        this._messageService.show(
          `Winner bets identification confirmed for: ${eventData.homeTeam} x  ${eventData.visitorTeam}`
        );
      });
      // prizes calculated
      (
        await this.gameCompound.gameService.getEventBehaviorSubject({
          eventName: GameService.EVENTS.GAME_PRIZES_CALCULATED,
        })
      ).subscribe((evt) => {
        if (evt == null) return;
        const eventData: GameEvent = evt;
        this.gameCompound.game.prizesCalculated = true;
        this.prizesCalculated = true;
        this._messageService.show(
          `Prizes calculation confirmed for: ${eventData.homeTeam} x  ${eventData.visitorTeam}`
        );
      });
    } catch (e: any) {
      console.log('deu ruim');
      this._messageService.show(e.message);
    }
  }

  openForBetting() {
    this.action(Action.OPEN);
    this.gameCompound.gameService.openForBetting(this._genericCallback.bind(this)).subscribe((transactionResult) => {
      this._messageService.show(transactionResult.result);
      if (transactionResult.success) {
        this._messageService.show(transactionResult.result);
      } else {
        this.action();
      }
    });
  }

  closeForBetting() {
    this.action(Action.CLOSE);
    this.gameCompound.gameService.closeForBetting(this._genericCallback.bind(this)).subscribe((transactionResult) => {
      this._messageService.show(transactionResult.result);
      if (transactionResult.success) {
        this._messageService.show(transactionResult.result);
      } else {
        this.action();
      }
    });
  }

  finalizeGame() {
    if (!this.userAccountAddress || !this.gameCompound?.game?.addressGame) {
      return;
    }
    const dialogRef = this._dialog.open(ScoreDialogComponent, {
      data: {
        title: `Game's Final Score`,
        homeTeam: this.homeTeam,
        visitorTeam: this.visitorTeam,
      },
    });

    dialogRef.afterClosed().subscribe((score) => {
      if (score) {
        if (score.home != null && score.visitor != null) {
          this.action(Action.FINALIZE);
          this.gameCompound.gameService
            .finalizeGame(this.gameCompound.game, score, this.finalizeCallback.bind(this))
            .subscribe((transactionResult) => {
              if (transactionResult.success) {
                this._messageService.show(transactionResult.result);
              } else {
                this.action();
              }
            });
        } else {
          this._messageService.show(`Score is not valid`);
        }
      }
    });
  }
  private async finalizeCallback(confirmationResult: TransactionResult<string>) {
    this.finalized = await this.gameCompound.gameService.finalized();
    this.gameCompound.game.finalized = this.finalized;
    this.action();
    // not showing message because the capture of the event is already doing it
    //this._messageService.show(confirmationResult.result);
    this._changeDetectorRefs.detectChanges();
    if (confirmationResult.success == false) {
      this._messageService.show(confirmationResult.result);
    }
  }

  identifyWinners() {
    this.action(Action.IDENTIFY_WINNERS);
    this.gameCompound.gameService
      .identifyWinners(this.gameCompound.game, this.identifyWinnersCallback.bind(this))
      .subscribe((transactionResult) => {
        if (!transactionResult.success) {
          this.action();
        }
        this._messageService.show(transactionResult.result);
      });
  }
  private async identifyWinnersCallback(confirmationResult: TransactionResult<string>) {
    this.winnersIdentified = await this.gameCompound.gameService.winnersIdentified();
    this.gameCompound.game.winnersIdentified = this.winnersIdentified;
    this.action();
    // showing message only if not succeded because the capture of the event is already doing it when it is confirmed
    if (confirmationResult.success == false) {
      this._messageService.show(confirmationResult.result);
    }
    this._changeDetectorRefs.detectChanges();
  }

  calcPrizes() {
    this.action(Action.CALC_PRIZES);
    this.gameCompound.gameService
      .calcPrizes(this.gameCompound.game, this.calcPrizesCallback.bind(this))
      .subscribe((transactionResult) => {
        if (!transactionResult.success) {
          this.action();
        }
        this._messageService.show(transactionResult.result);
      });
  }
  private async calcPrizesCallback(confirmationResult: TransactionResult<string>) {
    this.prizesCalculated = await this.gameCompound.gameService.prizesCalculated();
    this.gameCompound.game.prizesCalculated = this.prizesCalculated;
    this.action();
    // showing message only if not succeded because the capture of the event is already doing it when it is confirmed
    if (confirmationResult.success == false) {
      this._messageService.show(confirmationResult.result);
    }
    this._changeDetectorRefs.detectChanges();
  }

  approve(event: MouseEvent) {
    if (!this.userAccountAddress) return;
    this._betTokenService.balanceOf(this.userAccountAddress).subscribe((_balanceSBT) => {
      if (_balanceSBT.success == false) {
        this._messageService.show(`It was not possible to get Bet Tokens balance`);
        return;
      }
      const dialogRef = this._dialog.open(BuyDialogComponent, {
        data: {
          title: `Approve BetTokens for: ${this.homeTeam} x ${this.visitorTeam}`,
          maxAmmount: _balanceSBT.result,
        },
      });

      dialogRef.afterClosed().subscribe((_allowanceData) => {
        if (_allowanceData) {
          if (_allowanceData.value != null && this.userAccountAddress) {
            this.action(Action.APPROVE);
            this._betTokenService
              .approve(
                this.userAccountAddress,
                this.gameCompound.game.addressGame as string,
                new BN(_allowanceData.value),
                this._genericCallback.bind(this)
              )
              .subscribe((transactionResult) => {
                if (!transactionResult.success) {
                  this.action();
                }
                this._messageService.show(transactionResult.result);
              });
          } else {
            this._messageService.show(`Quantity of BetTokens is not valid`);
          }
        }
      });
    });
  }

  private _genericCallback(confirmationResult: TransactionResult<string>) {
    this.action();
    // not showing message because the capture of the event is already doing it
    //this._messageService.show(confirmationResult.result);
    this._changeDetectorRefs.detectChanges();
    if (confirmationResult.success == false) {
      this._messageService.show(confirmationResult.result);
    }
  }

  bet() {
    if (!this.userAccountAddress || !this.gameCompound?.game?.addressGame) {
      return;
    }
    this.action(Action.BET);
    this._betTokenService
      .allowance(this.userAccountAddress, this.gameCompound.game.addressGame)
      .subscribe((_allowance) => {
        this.action();
        if (_allowance.success == false) {
          this._messageService.show(
            `It was not possible to get the number of Bet Tokens approved to be spent on this game`
          );
        } else if ((_allowance.result as BN).eq(new BN(0))) {
          this._messageService.show(`There is no BetTokens approved to be spent on this game`);
        } else {
          const dialogRef = this._dialog.open(BetDialogComponent, {
            data: {
              title: `Place your Bet`,
              homeTeam: this.homeTeam,
              visitorTeam: this.visitorTeam,
              allowance: _allowance.result,
            },
          });

          dialogRef.afterClosed().subscribe((_bet) => {
            if (_bet) {
              if (_bet.home != null && _bet.visitor != null && _bet.value != null) {
                this.action(Action.BET);
                this.gameCompound.gameService
                  .bet({ home: _bet.home, visitor: _bet.visitor }, _bet.value)
                  .subscribe((transactionResult) => {
                    this._messageService.show(transactionResult.result);
                    this.action();
                  });
              } else {
                this._messageService.show(`Bet is not valid`);
              }
            }
          });
        }
      });
  }

  hideAllowance() {
    this.formatedRemainingAllowance = null;
  }
  showAllowance() {
    if (!this.userAccountAddress) return;
    this.action(Action.INFO);
    this._betTokenService
      .allowance(this.userAccountAddress, this.gameCompound.game.addressGame as string)
      .subscribe((_remainingAllowance) => {
        this.action();
        if (_remainingAllowance.success == false) {
          this._messageService.show(
            `It was not possible to get the number of Bet Tokens approved to be spent on this game`
          );
        } else {
          this.formatedRemainingAllowance = this._numberService.formatBNShortScale(_remainingAllowance.result as BN);
          this._changeDetectorRefs.detectChanges();
        }
      });
  }

  listBets() {
    this.action(Action.INFO);
    this.gameCompound.gameService.listBets().subscribe((_result) => {
      if (!_result.success) {
        this._messageService.show(_result.result as string);
        this.action();
      } else {
        this._dialog.open(GameBetsDialogComponent, {
          data: {
            gameCompound: this.gameCompound,
            homeTeam: this.homeTeam,
            visitorTeam: this.visitorTeam,
            bets: _result.result,
          },
          minWidth: 900,
        });
        this.action();
      }
    });
  }

  listWinners() {
    this.action(Action.INFO);
    this.gameCompound.gameService.listBets().subscribe((_result) => {
      if (!_result.success) {
        this._messageService.show(_result.result as string);
        this.action();
      } else {
        const _winnerResuts = [BetResult.WINNER, BetResult.TIED, BetResult.PAID];
        const _winners = (_result.result as Bet[]).filter((b) => _winnerResuts.includes(b.result as BetResult));
        if (_winners.length > 0) {
          this._dialog.open(GameWinnersDialogComponent, {
            data: {
              gameCompound: this.gameCompound,
              winnerBets: _winners,
            },
            minWidth: 900,
          });
        } else {
          this._messageService.show(`No winners on this game`);
        }
        this.action();
      }
    });
  }

  /**
   * Open dialog with additional info about the game
   */
  showInfo() {
    this._dialog.open(GameInfoDialogComponent, {
      data: {
        gameCompound: this.gameCompound,
      },
    });
  }

  private async action(a?: Action) {
    if (a) {
      this.currentAction = a;
      this.loading = true;
    } else {
      this.currentAction = Action.NONE;
      this.loading = false;
      // when finishes some action, load the condition of current account be able to close or finalize the game
      this.canClose = await this.gameCompound.gameService.canClose();
      this.canFinalize = await this.gameCompound.gameService.canFinalize();
      this._changeDetectorRefs.detectChanges();
    }
  }
}

enum Action {
  NONE = '',
  INFO = 'INFO',
  APPROVE = `APPROVE`,
  BET = 'BET',
  OPEN = `OPEN`,
  CLOSE = `CLOSE`,
  FINALIZE = `FINALIZE`,
  IDENTIFY_WINNERS = `IDENTIFY_WINNERS`,
  CALC_PRIZES = `CALC_PRIZES`,
}
