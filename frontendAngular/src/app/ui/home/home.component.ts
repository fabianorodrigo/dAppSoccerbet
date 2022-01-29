import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'dapp-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  ngOnInit(): void {}

  public executeSelectedChange = (event: any) => {
    console.log(event);
  };
}
