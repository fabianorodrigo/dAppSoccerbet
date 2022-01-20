import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, Input, OnInit } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';

@Component({
  selector: 'dapp-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  @Input() title: String = 'Ðapp';
  @Input() icon!: String;

  menuItems = ['Home', 'Transaction'];

  ngOnInit(): void {}

  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(
      map((result) => {
        return result.matches;
      }),
      shareReplay()
    );

  constructor(private breakpointObserver: BreakpointObserver) {}
}
