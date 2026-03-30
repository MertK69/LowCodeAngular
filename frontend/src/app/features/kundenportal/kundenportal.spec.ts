import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Kundenportal } from './kundenportal';

describe('Kundenportal', () => {
  let component: Kundenportal;
  let fixture: ComponentFixture<Kundenportal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Kundenportal],
    }).compileComponents();

    fixture = TestBed.createComponent(Kundenportal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
