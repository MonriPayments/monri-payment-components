import { ElementRef, inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CustomEventService {
  constructor(private element: ElementRef) {}

  dispatchEvent(listener: string, event: string | any) {
    this.element.nativeElement.dispatchEvent(
      new CustomEvent(listener, {
        detail: event
      })
    );
  }
}
