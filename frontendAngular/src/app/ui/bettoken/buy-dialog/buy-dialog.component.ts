import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

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
    public data: { title: string; homeTeam: string; visitorTeam: string }
  ) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      value: [null, [Validators.required, Validators.min(1)]],
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
}
