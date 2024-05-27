import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {QRCodeModule} from 'angularx-qrcode';
import {HttpClientModule} from '@angular/common/http';
import {KeksPayComponent} from "../../../../../libs/keks-pay/src/lib/keks-pay.component";
import {TranslationService} from "../../../../../libs/keks-pay/src/lib/services/translation.service";
import {KeksPayService} from "../../../../../libs/keks-pay/src/lib/services/keks-pay.service";
import {TranslatePipe} from "../../../../../libs/keks-pay/src/lib/pipes/translate.pipe";

describe('KeksPayComponent', () => {
  let component: KeksPayComponent;
  let fixture: ComponentFixture<KeksPayComponent>;
  let translationServiceSpy: jasmine.SpyObj<TranslationService>;
  let keksPayServiceSpy: jasmine.SpyObj<KeksPayService>;

  beforeEach(async () => {
    let translateServiceSpy = jasmine.createSpyObj('TranslationService', [
      'translate'
    ]);
    keksPayServiceSpy = jasmine.createSpyObj('KeksPayService', [
      'startPayment'
    ]);
    translateServiceSpy.currentLang = 'en';

    await TestBed.configureTestingModule({
      imports: [
        KeksPayComponent,
        HttpClientModule,
        QRCodeModule,
        TranslatePipe
      ],
      providers: [
        {
          provide: KeksPayService,
          useValue: keksPayServiceSpy
        },
        {
          provide: TranslationService,
          useValue: translateServiceSpy
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(KeksPayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    translationServiceSpy = TestBed.inject(
      TranslationService
    ) as jasmine.SpyObj<TranslationService>;
    keksPayServiceSpy = TestBed.inject(
      KeksPayService
    ) as jasmine.SpyObj<KeksPayService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update resolution', () => {
    component.resolution = 500;
    expect(component.resolution()).toBe(500);
  });

  it('should update isLoading', () => {
    component.isLoading = true;
    expect(component.isLoading()).toBe(true);
  });

  it('should update isMobileView', () => {
    component.resolution = 500;
    expect(component.isMobileView()).toBe(true);
  });

  it('should update url', () => {
    component.url = 'hamdija.com';
    expect(component.url()).toBe('hamdija.com');
  });

  it('should update inputParams', () => {
    component.inputParams = {
      payment_method: 'keks-pay',
      data: {
        lang: 'en'
      }
    };
    expect(component.inputParams()).toEqual({
      payment_method: 'keks-pay',
      data: {
        lang: 'en'
      }
    });
  });

  it('should get translationService', () => {
    const service = component.translationService;
    expect(service).toBeTruthy();
  });

  it('should open a new window with the correct URL', () => {
    const windowOpenSpy = spyOn(window, 'open');
    const expectedUrl = 'http://expected.url';

    spyOn(component, 'url').and.returnValue(expectedUrl);
    component.url = expectedUrl;
    component.navigate();

    expect(windowOpenSpy).toHaveBeenCalledWith(expectedUrl, '_blank');
  });

  it('should update resolution on window resize', () => {
    const mockInnerWidth = 800;
    const event = new Event('resize');

    Object.defineProperty(window, 'innerWidth', {value: mockInnerWidth});
    window.dispatchEvent(event);

    expect(component.resolution()).toBe(mockInnerWidth);
  });

  it('should call setLanguage when lang is present in inputParams', () => {
    component.inputParams = {
      payment_method: 'keks-pay',
      data: {
        lang: 'en'
      }
    };

    component.ngOnInit();

    expect(translationServiceSpy.currentLang).toBe('en');
  });
});
