import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import BN from 'bn.js';
import { createBigNumberMaxValidator } from 'src/app/shared';

@Component({
  selector: 'dapp-buy-dialog',
  templateUrl: './buy-dialog.component.html',
  styleUrls: ['./buy-dialog.component.css'],
})
export class BuyDialogComponent implements OnInit {
  form!: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      title: string;
      homeTeam: string;
      visitorTeam: string;
      maxAmmount: BN;
    }
  ) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      value: [
        null,
        [
          Validators.required,
          Validators.min(1),
          //TODO: Test better if this validation is strictly correct
          createBigNumberMaxValidator(this.data.maxAmmount),
        ],
      ],
    });
  }

  /**
   * We need to convert the value to string. If a huge number, the constructor of BN throws exception
   *
   * @param formRawValue Object with form values
   * @returns Struct with form values in string format
   */
  convertNumberToString(formRawValue: { value: number }): { value: string } {
    return {
      value: formRawValue?.value?.toLocaleString('fullWide', {
        useGrouping: false,
      }),
    };
  }
}
