import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Game } from 'src/app/model/game.interface';

@Component({
  selector: 'dapp-admin-games-form',
  templateUrl: './admin-games-form.component.html',
  styleUrls: ['./admin-games-form.component.css'],
})
export class AdminGamesFormComponent implements OnInit {
  @Output() onCloseEdition = new EventEmitter<Game | null>();

  form!: FormGroup;
  @ViewChild('picker') picker: any;

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      homeTeam: [null, [Validators.required, Validators.minLength(1)]],
      visitorTeam: [null, [Validators.required, Validators.minLength(1)]],
      datetimeGame: [null, []],
      hours: [null, [Validators.max(23), Validators.min(0)]],
      minutes: [null, [Validators.max(59), Validators.min(0)]],
    });
  }

  save(event: MouseEvent) {
    event.preventDefault();
    const formValue = this.form.getRawValue();
    const dateTime: Date = formValue.datetimeGame;
    dateTime.setHours(formValue.hours);
    dateTime.setMinutes(formValue.minutes);
    dateTime.setSeconds(0);
    dateTime.setMilliseconds(0);
    //TODO: tratar timezone
    this.onCloseEdition.emit({
      homeTeam: formValue.homeTeam,
      visitorTeam: formValue.visitorTeam,
      datetimeGame: dateTime.getTime(),
      open: false,
      finalized: false,
    });
  }
  cancel(event: MouseEvent) {
    event.preventDefault();
    this.onCloseEdition.emit(null);
  }
}
