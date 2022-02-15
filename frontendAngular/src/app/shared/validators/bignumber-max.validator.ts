import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import BN from 'bn.js';

export function createBigNumberMaxValidator(max: BN): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    const stringRep = value.toLocaleString('fullWide', {
      useGrouping: false,
    });
    if (max.lt(new BN(stringRep))) {
      return { bigNumberMaxOverflow: true };
    }
    return null;
  };
}
