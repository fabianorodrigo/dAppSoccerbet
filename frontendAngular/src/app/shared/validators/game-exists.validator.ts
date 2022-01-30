import { Injectable } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { debounceTime, first, map, switchMap } from 'rxjs/operators';
import { GameFactoryService } from './../../contracts/game-factory.service';

@Injectable({ providedIn: 'root' })
export class GameExistsValidator {
  constructor(private gameFactoryService: GameFactoryService) {}

  checkSiglaSistemaNaoDisponivel() {
    return (control: AbstractControl) => {
      return control.valueChanges
        .pipe(debounceTime(300))
        .pipe(switchMap(async (id) => this.gameFactoryService.exists(id)))
        .pipe(map((exists) => (exists === true ? { gameExists: true } : null)))
        .pipe(first());
    };
  }
}
