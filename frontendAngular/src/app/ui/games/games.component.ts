import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'dapp-games',
  templateUrl: './games.component.html',
  styleUrls: ['./games.component.css'],
})
export class GamesComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
  public executeSelectedChange = (event: any) => {
    console.log(event);
  };
}
