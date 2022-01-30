import { Injectable } from '@angular/core';
import {
  MatSnackBar,
  MatSnackBarRef,
  TextOnlySnackBar,
} from '@angular/material/snack-bar';
import { Observer } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  constructor(private _snackBar: MatSnackBar) {}

  private snackBarRef!: MatSnackBarRef<TextOnlySnackBar>;

  ngOnInit(): void {}

  showAction(
    message: string,
    actionLabel: string,
    action: Partial<Observer<void>> | undefined
  ) {
    this.snackBarRef = this._snackBar.open(message, actionLabel);
    this.snackBarRef.afterDismissed().subscribe((x) => {
      console.log(`afterdismisses`, x);
    });
    this.snackBarRef.onAction().subscribe(action);
  }

  show(message: string) {
    this.snackBarRef = this._snackBar.open(message);
    this.snackBarRef.afterDismissed().subscribe((x) => {
      console.log(`afterdismisses`, x);
    });
  }
}
