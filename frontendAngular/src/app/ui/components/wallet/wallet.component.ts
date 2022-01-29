import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  OnInit,
  Output,
} from '@angular/core';
import { BetTokenService } from 'src/app/contracts/bettoken.service';
import { WEB3 } from 'src/app/core/web3';
import { ProviderMessage } from 'src/app/model/metamask/ProviderMessage';
import { Web3Service } from 'src/app/services';
import Web3 from 'web3';
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
    @Inject(WEB3) web3: Web3,
    private changeDetectorRefs: ChangeDetectorRef,
    private betTokenContractService: BetTokenService
  ) {}

  async ngOnInit() {
    if (window.ethereum) {
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
    this.onChangeAccount.emit(this.accountAddress);
    console.log(`wallet ${accounts[0]} valido? `);
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
