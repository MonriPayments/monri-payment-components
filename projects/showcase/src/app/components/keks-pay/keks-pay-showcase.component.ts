import { Component } from '@angular/core';
import { KeksPayComponent } from '../../../../../libs/keks-pay/src/lib/keks-pay.component';

@Component({
  selector: 'app-keks-pay',
  standalone: true,
  imports: [KeksPayComponent],
  templateUrl: './keks-pay-showcase.component.html',
  styleUrl: './keks-pay-showcase.component.scss'
})
export class KeksPayShowcaseComponent {}
