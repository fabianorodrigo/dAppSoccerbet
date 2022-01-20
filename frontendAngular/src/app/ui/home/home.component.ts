import { Contract } from 'web3-eth-contract';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { BetTokenService } from '../../contracts/bettoken.service';

@Component({
  selector: 'dapp-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  constructor(private betTokenContractService: BetTokenService) {}

  ngOnInit(): void {
    this.betTokenContractService
      .balanceOf('0x3bc6f9De12EEA663A14dEea37f153f1166830761')
      .subscribe((value) => {
        console.log(value);
      });
  }
}
