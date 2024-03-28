import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KeksPayShowcaseComponent } from './keks-pay-showcase.component';

describe('KeksPayComponent', () => {
  let component: KeksPayShowcaseComponent;
  let fixture: ComponentFixture<KeksPayShowcaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KeksPayShowcaseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KeksPayShowcaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
