import { Component, inject, Input, Signal } from '@angular/core';
import { patchState } from '@ngrx/signals';
import { KeksPayStore } from './keks-pay.store';

@Component({
  selector: 'lib-keks-pay',
  standalone: true,
  imports: [],
  templateUrl: 'keks-pay.component.html',
  styleUrl: 'keks-pay.component.scss',
  providers: [KeksPayStore]
})
export class KeksPayComponent {
  readonly keksPayStore = inject(KeksPayStore);

  @Input() set billid(value: string) {
    patchState(this.keksPayStore, { billid: value });
  }

  @Input() set keksid(value: string) {
    patchState(this.keksPayStore, { keksid: value });
  }

  @Input() set tid(value: string) {
    patchState(this.keksPayStore, { tid: value });
  }

  @Input() set store(value: string) {
    patchState(this.keksPayStore, { store: value });
  }

  @Input() set amount(value: number) {
    patchState(this.keksPayStore, { amount: value });
  }

  @Input() set status(value: number) {
    patchState(this.keksPayStore, { status: value });
  }

  @Input() set message(value: string) {
    patchState(this.keksPayStore, { message: value });
  }
}
