import { Component, inject, Input } from '@angular/core';
import { patchState } from '@ngrx/signals';
import { KeksPayStore } from './keks-pay.store';
import { QRCodeModule } from 'angularx-qrcode';
import { CustomEventService } from './services/custom-event.service';

@Component({
  selector: 'lib-keks-pay',
  standalone: true,
  imports: [QRCodeModule],
  templateUrl: 'keks-pay.component.html',
  styleUrl: 'keks-pay.component.scss',
  providers: [KeksPayStore, CustomEventService]
})
export class KeksPayComponent {
  readonly keksPayStore = inject(KeksPayStore);

  @Input() set billid(value: string) {
    patchState(this.keksPayStore, { billid: value });
  }

  @Input() set cid(value: string) {
    patchState(this.keksPayStore, { cid: value });
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
}
