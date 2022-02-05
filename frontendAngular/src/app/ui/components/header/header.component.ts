import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'dapp-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  @Input() title: String = 'Ðapp';
  @Input() icon!: String;
  @Input() userAccountAddress: string | null = null;

  @Output() public sidenavToggle = new EventEmitter();
  @Output() onChangeAccount = new EventEmitter<string | null>();

  constructor(private breakpointObserver: BreakpointObserver) {}

  ngOnInit(): void {}

  public onToggleSidenav = () => {
    this.sidenavToggle.emit();
  };
}
