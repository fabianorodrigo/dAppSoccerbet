import { environment } from 'src/environments/environment';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'Soccer Bet Ðapp';
  icon = 'sports_soccer';

  ngOnInit(): void {
    console.log(`BetToken.address`, environment.betTokenAddress);
    console.log(`GameFactory.address`, environment.gameFactoryAddress);
  }
}
