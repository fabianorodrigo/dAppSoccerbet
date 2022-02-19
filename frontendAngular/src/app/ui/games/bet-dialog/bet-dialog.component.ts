import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import BN from 'bn.js';
import { NumbersService } from 'src/app/services';
import { createBigNumberMaxValidator } from 'src/app/shared';

@Component({
  selector: 'dapp-bet-dialog',
  templateUrl: './bet-dialog.component.html',
  styleUrls: ['./bet-dialog.component.css'],
})
export class BetDialogComponent implements OnInit {
  form!: FormGroup;
  formattedMax!: string;

  constructor(
    private formBuilder: FormBuilder,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      title: string;
      homeTeam: string;
      visitorTeam: string;
      allowance: BN;
    },
    private _numberService: NumbersService
  ) {}

  ngOnInit(): void {
    if (this.data.allowance) {
      this.formattedMax = this._numberService.formatBN(this.data.allowance);
    }
    this.form = this.formBuilder.group({
      value: [
        null,
        [
          Validators.required,
          Validators.min(1),
          createBigNumberMaxValidator(this.data.allowance),
        ],
      ],
      home: [
        null,
        [Validators.required, Validators.min(0), Validators.max(20)],
      ],
      visitor: [
        null,
        [Validators.required, Validators.min(0), Validators.max(20)],
      ],
    });
  }

  /**
   * @returns The error message accordingly to the error found
   */
  getErrorMessage() {
    if (this.form.controls['value'].hasError('required')) {
      return 'You must enter a quantity of BetToken';
    }
    return this.form.controls['value'].hasError('bigNumberMaxOverflow')
      ? `Max: ${this.formattedMax}`
      : '';
  }

  /**
   * We need to convert the value to string. If a huge number, the constructor of BN throws exception
   *
   * @param formRawValue Object with form values
   * @returns Struct with form values in string format
   */
  convertNumberToString(formRawValue: {
    home: number;
    visitor: number;
    value: number;
  }): { home: number; visitor: number; value: string } {
    return {
      ...formRawValue,
      value: this._numberService.convertNumberToString(formRawValue?.value),
    };
  }
}
