import { environment } from './../../../environments/environment.prod';
import { Component, OnInit } from '@angular/core';
import { BetTokenService, GameFactoryService } from 'src/app/contracts';

@Component({
  selector: 'dapp-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  betTokenAddress = environment.betTokenAddress;
  gameFactoryAddress = environment.gameFactoryAddress;
  calculatorAddress = environment.calculatorAddress;

  betTokenOwner!: string;
  gameFactoryOwner!: string;
  calculatorOwner!: string;

  constructor(private _betToken: BetTokenService, private _gameFactory: GameFactoryService) {}

  ngOnInit(): void {
    this._betToken.owner().subscribe((owner) => {
      this.betTokenOwner = owner;
    });

    this._gameFactory.owner().subscribe((owner) => {
      this.gameFactoryOwner = owner;
    });
  }

  public executeSelectedChange = (event: any) => {
    console.log(event);
  };
}
