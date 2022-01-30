import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'dapp-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
})
export class MenuComponent implements OnInit {
  @Input() owner: string | null = null;
  @Input() userAccountAddress: string | null = null;

  @Output() sidenavClose = new EventEmitter();

  constructor() {}
  ngOnInit() {}
  public onSidenavClose = () => {
    this.sidenavClose.emit();
  };
}
