import {Component, Input, signal, WritableSignal} from '@angular/core';

@Component({
  selector: 'lib-keks-pay',
  standalone: true,
  imports: [],
  templateUrl: 'keks-pay.component.html',
  styleUrl: 'keks-pay.component.scss'
})
export class KeksPayComponent {
  private _billId: WritableSignal<string> = signal('');
  private _keksId: WritableSignal<string> = signal('');
  private _tid: WritableSignal<string> = signal('');
  private _store: WritableSignal<string> = signal('');
  private _amount: WritableSignal<number> = signal(0);
  private _status: WritableSignal<number> = signal(0);
  private _message: WritableSignal<string> = signal('');

  get billId(): WritableSignal<string> {
    return this._billId;
  }

  @Input() set billId(value: string) {
    this._billId.set(value);
  }

  get keksId(): WritableSignal<string> {
    return this._keksId;
  }

  @Input() set keksId(value: string) {
    this._keksId.set(value);
  }

  get tid(): WritableSignal<string> {
    return this._tid;
  }

  @Input() set tid(value: string) {
    this._tid.set(value);
  }

  get store(): WritableSignal<string> {
    return this._store;
  }

  @Input() set store(value: string) {
    this._store.set(value);
  }

  get amount(): WritableSignal<number> {
    return this._amount;
  }

  @Input() set amount(value: number) {
    this._amount.set(value);
  }

  get status(): WritableSignal<number> {
    return this._status;
  }

  @Input() set status(value: number) {
    this._status.set(value);
  }

  get message(): WritableSignal<string> {
    return this._message;
  }

  @Input() set message(value: string) {
    this._message.set(value);
  }
}
