import {
  Component,
  computed,
  HostListener,
  inject,
  Input,
  OnInit,
  Signal,
  signal,
  WritableSignal
} from '@angular/core';
import { KeksPayService } from './services/keks-pay.service';
import { QRCodeModule } from 'angularx-qrcode';
import { take } from 'rxjs';
import { StartPaymentRequest } from './services/alternative-payment-method.interface';
import { TranslationService } from './services/translation.service';
import { TranslatePipe } from './pipes/translate.pipe';

@Component({
  selector: 'lib-keks-pay',
  standalone: true,
  imports: [QRCodeModule, TranslatePipe],
  templateUrl: 'keks-pay.component.html',
  styleUrl: 'keks-pay.component.scss',
  providers: [KeksPayService, TranslationService]
})
export class KeksPayComponent implements OnInit {
  private _isLoading = signal(true);
  private _resolution = signal(window.innerWidth);
  private _isMobileView = computed(() => this.resolution() <= 768);
  private _url = signal('');
  private _inputParams = signal<StartPaymentRequest>({
    payment_method: '',
    data: {}
  });
  private readonly _keksPayService: KeksPayService = inject(KeksPayService);
  private readonly _translationService: TranslationService =
    inject(TranslationService);

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.resolution.set(window.innerWidth);
  }

  ngOnInit(): void {
    (window as any).keksPay = this.keksPayService;

    if (this.inputParams().data['lang']) {
      this.translationService.setLanguage(this.inputParams().data['lang']);
    }

    this.keksPayService
      .startPayment(this.inputParams())
      .pipe(take(1))
      .subscribe(response => {
        if (response.status === 'approved') {
          this.url.set(response.qr_code_text as string);
          this.isLoading = false;
        } else {
          throw new Error('An error occurred');
        }
      });
  }

  navigate() {
    window.open(this.url(), '_blank');
  }

  get inputParams(): WritableSignal<StartPaymentRequest> {
    return this._inputParams;
  }

  @Input() set inputParams(value: StartPaymentRequest) {
    this._inputParams.set(value);
  }

  get url(): WritableSignal<string> {
    return this._url;
  }

  get isLoading(): WritableSignal<boolean> {
    return this._isLoading;
  }

  set isLoading(value: boolean) {
    this._isLoading.set(value);
  }

  set url(value: string) {
    this._url.set(value);
  }

  get isMobileView(): Signal<boolean> {
    return this._isMobileView;
  }

  get resolution(): WritableSignal<number> {
    return this._resolution;
  }

  set resolution(value: number) {
    this._resolution.set(value);
  }

  get keksPayService(): KeksPayService {
    return this._keksPayService;
  }

  get translationService(): TranslationService {
    return this._translationService;
  }
}
