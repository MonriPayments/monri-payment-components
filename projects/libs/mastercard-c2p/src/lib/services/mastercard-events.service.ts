import { Injectable } from '@angular/core';

export interface MastercardEventBase {
  type: string;
  componentId: string;
}

export interface MastercardEventWithRequestId extends MastercardEventBase {
  requestId: string;
}

export interface MastercardResponseEvent extends MastercardEventBase {
  requestId: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface MastercardMaskedCardsChangedEvent extends MastercardEventBase {
  type: 'MASTERCARD_MASKED_CARDS_CHANGED';
  maskedCardsCount: number;
}

export interface MastercardComponentReadyEvent extends MastercardEventBase {
  type: 'MASTERCARD_COMPONENT_READY';
}

export interface MastercardAuthenticationCompleteEvent extends MastercardEventBase {
  type: 'MASTERCARD_AUTHENTICATION_COMPLETE';
  maskedCardsCount: number;
}

export interface MastercardButtonClickedEvent extends MastercardEventBase {
  type: 'MASTERCARD_BUTTON_CLICKED';
}

export type MastercardEvent = 
  | MastercardMaskedCardsChangedEvent 
  | MastercardComponentReadyEvent 
  | MastercardAuthenticationCompleteEvent
  | MastercardButtonClickedEvent
  | MastercardResponseEvent;

@Injectable({
  providedIn: 'root'
})
export class MastercardEventsService {
  private readonly componentId = 'mastercard-c2p';
  private lastEmittedCount = -1; // Track to prevent duplicate emissions

  emitMaskedCardsChanged(maskedCardsCount: number): void {
    // Prevent duplicate emissions
    if (maskedCardsCount === this.lastEmittedCount) {
      return;
    }
    
    this.lastEmittedCount = maskedCardsCount;
    this.postEvent({
      type: 'MASTERCARD_MASKED_CARDS_CHANGED',
      componentId: this.componentId,
      maskedCardsCount
    });
  }

  emitComponentReady(): void {
    this.postEvent({
      type: 'MASTERCARD_COMPONENT_READY',
      componentId: this.componentId
    });
  }

  emitAuthenticationComplete(maskedCardsCount: number): void {
    this.postEvent({
      type: 'MASTERCARD_AUTHENTICATION_COMPLETE',
      componentId: this.componentId,
      maskedCardsCount
    });
  }

  emitButtonClicked(): void {
    this.postEvent({
      type: 'MASTERCARD_BUTTON_CLICKED',
      componentId: this.componentId
    });
  }

  emitResponse(requestId: string, success: boolean, data?: unknown, error?: string): void {
    this.postEvent({
      type: 'MASTERCARD_RESPONSE',
      componentId: this.componentId,
      requestId,
      success,
      data,
      error
    });
  }

  private postEvent(event: MastercardEvent | MastercardResponseEvent): void {
    window.postMessage(event, '*');
  }

  sendMessageWithPromise(type: string, data?: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const requestId = `${type}_${Date.now()}_${Math.random()}`;

      const timeout = setTimeout(() => {
        window.removeEventListener('message', responseHandler);
        reject(new Error(`Timeout waiting for response to ${type}`));
      }, 5000);

      const responseHandler = (event: MessageEvent) => {
        if (
          event.data.type === 'MASTERCARD_RESPONSE' &&
          event.data.requestId === requestId
        ) {
          clearTimeout(timeout);
          window.removeEventListener('message', responseHandler);

          if (event.data.success) {
            resolve(event.data.data);
          } else {
            reject(new Error(event.data.error || 'Unknown error'));
          }
        }
      };

      window.addEventListener('message', responseHandler);

      window.postMessage(
        {
          type,
          requestId,
          ...(data || {})
        },
        '*'
      );
    });
  }
}