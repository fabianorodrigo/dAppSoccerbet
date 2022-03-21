import { Component, Input, OnInit } from '@angular/core';
import BN from 'bn.js';
import { NumbersService } from 'src/app/services';

@Component({
  selector: 'dapp-short-scale-number',
  templateUrl: './short-scale-number.component.html',
  styleUrls: ['./short-scale-number.component.css'],
})
export class ShortScaleNumberComponent implements OnInit {
  @Input() value!: BN;
  @Input() unit!: string;
  @Input()
  ngClass: string | string[] | Set<string> | { [klass: string]: any } = '';

  formatedBalance!: string;
  formatedBalanceTooltip!: string;

  constructor(private _numberService: NumbersService) {}

  ngOnInit(): void {
    if (this.value) {
      this.formatedBalance = this._numberService.formatBNShortScale(this.value);
      this.formatedBalanceTooltip = this._numberService.formatBN(this.value);
    }
  }
}
