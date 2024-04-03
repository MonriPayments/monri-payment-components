import { ElementRef, inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CustomEventService {
  readonly #elementRef = inject(ElementRef);

  dispatchEvent(listener: string, event: string | any) {
    this.#elementRef.nativeElement.dispatchEvent(
      new CustomEvent(listener, {
        detail: event
      })
    );
  }
}
