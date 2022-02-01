import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  Output,
} from '@angular/core';
import { BetTokenService } from 'src/app/contracts/bettoken.service';
import { Web3Service } from 'src/app/services';
import { ProviderErrors } from './../../../model/eip1193/providerErrors';

declare let window: any;

@Component({
  selector: 'dapp-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css'],
})
export class WalletComponent implements OnInit {
  @Output() onChangeAccount = new EventEmitter<string | null>();
  accountAddress: string | null = null;

  constructor(
    private _changeDetectorRefs: ChangeDetectorRef,
    private _betTokenContractService: BetTokenService,
    private _web3Service: Web3Service
  ) {}

  async ngOnInit() {
    this._web3Service.addAccountChangedListener(
      'wallet',
      this.handleOnAccountsChanged.bind(this)
    );
  }

  /**
   * Ask permission to connect to the Wallet (eg. Metamask) accounts
   *
   * @param event Mouse event instance
   */
  async connect(event: MouseEvent): Promise<void> {
    try {
      this._web3Service.currentAccount().subscribe((_account) => {
        this.accountAddress = _account;
        this.handleOnAccountsChanged([_account]);
      });
    } catch (err: any) {
      console.error(err);
      const providerError = ProviderErrors[err.code];
      if (providerError) {
        alert(
          `${providerError.title}: ${providerError.message}. You need to connect with an account in your wallet in order to make use of this Ðapp`
        );
      } else {
        alert('We had some problem connecting you wallet');
      }
    }
  }

  /**
   * Show BetToken balance of an specific account
   *
   * @param _accountAddress Account address to show balance
   */
  showBalance(_accountAddress: string) {
    this._betTokenContractService
      .balanceOf(_accountAddress)
      .subscribe((value) => {
        console.log(value);
      });
  }
  /**
   * Handles disconnect event. This event is emited when becomes unable to submit RPC
   * requests to any chain. In general, this will only happen due to network connectivity
   * issues or some unforeseen error.
   *
   * @param connectInfo ProviderRpcError
   */
  private handleOnAccountsChanged(_accounts: string[]) {
    if (_accounts.length > 0) {
      this.accountAddress = this._web3Service.toCheckSumAddress(_accounts[0]);
    } else {
      this.accountAddress = null;
    }
    //Angular not rerendering in spite of changing this.accountAddress
    this._changeDetectorRefs.detectChanges();
    this.onChangeAccount.emit(this.accountAddress);
  }
}
