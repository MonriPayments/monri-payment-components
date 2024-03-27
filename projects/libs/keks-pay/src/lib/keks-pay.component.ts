import {Component, inject, Input, OnInit} from '@angular/core';
import {KeksPayStateModel} from "./models/keks-pay.req.model";
import {KeksPayService} from "./services/keks-pay.service";
import {HttpClientModule} from "@angular/common/http";

@Component({
  selector: 'lib-keks-pay',
  standalone: true,
  imports: [HttpClientModule],
  templateUrl: 'keks-pay.component.html',
  styleUrl: 'keks-pay.component.scss',
  providers: [KeksPayService]
})
export class KeksPayComponent implements OnInit {
  private _state: KeksPayStateModel = {
    billid: '',
    keksid: '',
    tid: '',
    store: '',
    amount: 0,
    status: 0,
    message: ''
  };
  readonly #keksPayService = inject(KeksPayService);

  ngOnInit() {
    this.#keksPayService.authorizeTransaction(this.state).subscribe(data => {
      console.log(data)
    })
  }

  get state(): KeksPayStateModel {
    return this._state;
  }

  set state(value: KeksPayStateModel) {
    this._state = value;
  }

  get billid(): string {
    return this.state.billid;
  }

  @Input() set billid(value: string) {
    this.state.billid = value;
  }

  get keksid(): string {
    return this.state.keksid;
  }

  @Input() set keksid(value: string) {
    this.state.keksid = value;
  }

  get tid(): string {
    return this.state.tid;
  }

  @Input() set tid(value: string) {
    this.state.tid = value;
  }

  get store(): string {
    return this.state.store;
  }

  @Input() set store(value: string) {
    this.state.store = value;
  }

  get amount(): number {
    return this.state.amount;
  }

  @Input() set amount(value: number) {
    this.state.amount = value;
  }

  get status(): number {
    return this.state.status;
  }

  @Input() set status(value: number) {
    this.state.status = value;
  }

  get message(): string {
    return this.state.message;
  }

  @Input() set message(value: string) {
    this.state.message = value;
  }
}
