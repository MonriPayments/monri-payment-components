import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UacComponent } from '../uac.component';

describe('UacComponent', () => {
  let component: UacComponent;
  let fixture: ComponentFixture<UacComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UacComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UacComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
