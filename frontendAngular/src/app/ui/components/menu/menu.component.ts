import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'dapp-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
})
export class MenuComponent implements OnInit {
  @Output() sidenavClose = new EventEmitter();
  constructor() {}
  ngOnInit() {}
  public onSidenavClose = () => {
    this.sidenavClose.emit();
  };
}
