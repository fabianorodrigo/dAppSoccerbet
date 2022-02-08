import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'dapp-score-dialog',
  templateUrl: './score-dialog.component.html',
  styleUrls: ['./score-dialog.component.css'],
})
export class ScoreDialogComponent implements OnInit {
  form!: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    @Inject(MAT_DIALOG_DATA)
    public data: { title: string; homeTeam: string; visitorTeam: string }
  ) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
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
