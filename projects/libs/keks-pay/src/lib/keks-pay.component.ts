import { Component, Input, OnInit } from '@angular/core';
import { KeksPayService } from './services/keks-pay.service';
import { QRCodeModule } from 'angularx-qrcode';
import { CustomEventService } from './services/custom-event.service';

@Component({
  selector: 'lib-keks-pay',
  standalone: true,
  imports: [QRCodeModule],
  templateUrl: 'keks-pay.component.html',
  styleUrl: 'keks-pay.component.scss',
  providers: [KeksPayService, CustomEventService]
})
export class KeksPayComponent implements OnInit {
  constructor(
    public keksPayService: KeksPayService,
    public customEventService: CustomEventService
  ) {}

  @Input() url = '';

  ngOnInit(): void {
    this.customEventService.dispatchEvent('componentService', KeksPayService);
    (window as any).keksPay = this.keksPayService;
    (window as any).keksPayService = KeksPayService;
  }
}
