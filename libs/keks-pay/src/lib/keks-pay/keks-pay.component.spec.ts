import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KeksPayComponent } from './keks-pay.component';

describe('KeksPayComponent', () => {
  let component: KeksPayComponent;
  let fixture: ComponentFixture<KeksPayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KeksPayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KeksPayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
