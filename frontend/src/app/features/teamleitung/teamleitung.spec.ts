import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Teamleitung } from './teamleitung';

describe('Teamleitung', () => {
  let component: Teamleitung;
  let fixture: ComponentFixture<Teamleitung>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Teamleitung],
    }).compileComponents();

    fixture = TestBed.createComponent(Teamleitung);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
