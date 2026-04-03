import { ChangeDetectorRef, Pipe, PipeTransform, inject } from '@angular/core';

import { TranslationService } from '../services/translation.service';

@Pipe({
  name: 't',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform {
  private readonly translation = inject(TranslationService);
  private readonly cdr = inject(ChangeDetectorRef);

  transform(key: string): string {
    this.translation.language();
    this.cdr.markForCheck();
    return this.translation.instant(key);
  }
}
