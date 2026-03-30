import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Sachbearbeiter } from './sachbearbeiter';

describe('Sachbearbeiter', () => {
  let component: Sachbearbeiter;
  let fixture: ComponentFixture<Sachbearbeiter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sachbearbeiter],
    }).compileComponents();

    fixture = TestBed.createComponent(Sachbearbeiter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
