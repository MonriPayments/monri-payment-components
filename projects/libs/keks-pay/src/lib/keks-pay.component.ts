import {Component, inject, Input, Signal} from '@angular/core';
import {HttpClientModule} from "@angular/common/http";
import {patchState} from "@ngrx/signals";
import {KeksPayStore} from "./keks-pay.store";

@Component({
  selector: 'lib-keks-pay',
  standalone: true,
  imports: [HttpClientModule],
  templateUrl: 'keks-pay.component.html',
  styleUrl: 'keks-pay.component.scss',
  providers: [KeksPayStore]
})
export class KeksPayComponent {
  readonly keksPayStore = inject(KeksPayStore);

  get billid(): Signal<string> {
    return this.keksPayStore.billid;
  }

  @Input() set billid(value: string) {
    patchState(this.keksPayStore, {billid: value});
  }

  get keksid(): Signal<string> {
    return this.keksPayStore.keksid;
  }

  @Input() set keksid(value: string) {
    patchState(this.keksPayStore, {keksid: value});
  }

  get tid(): Signal<string> {
    return this.keksPayStore.tid;
  }

  @Input() set tid(value: string) {
    patchState(this.keksPayStore, {tid: value});
  }

  get store(): Signal<string> {
    return this.keksPayStore.store;
  }

  @Input() set store(value: string) {
    patchState(this.keksPayStore, {store: value});
  }

  get amount(): Signal<number> {
    return this.keksPayStore.amount;
  }

  @Input() set amount(value: number) {
    patchState(this.keksPayStore, {amount: value});
  }

  get status(): Signal<number> {
    return this.keksPayStore.status;
  }

  @Input() set status(value: number) {
    patchState(this.keksPayStore, {status: value});
  }

  get message(): Signal<string> {
    return this.keksPayStore.message;
  }

  @Input() set message(value: string) {
    patchState(this.keksPayStore, {message: value});
  }
}
