import {Component, effect, ElementRef, inject, viewChild} from '@angular/core';
import {UacStore} from "./store/uac.store";
import {UacService} from "./services/uac.service";

@Component({
  selector: 'lib-uac',
  standalone: true,
  imports: [],
  templateUrl: './uac.component.html',
  styleUrl: './uac.component.scss',
  providers: [UacStore, UacService]
})
export class UacComponent {
  protected readonly uacStore = inject(UacStore);
  paymentContainerRef = viewChild.required<ElementRef<HTMLDivElement>>('paymentContainer');

  constructor() {
    effect(() => {
      if (this.uacStore.redirectURL()) {
        this.uacStore.loadDivContent(this.paymentContainerRef())
      }
    });
  }
}
