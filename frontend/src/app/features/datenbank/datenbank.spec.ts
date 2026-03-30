import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Datenbank } from './datenbank';

describe('Datenbank', () => {
  let component: Datenbank;
  let fixture: ComponentFixture<Datenbank>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Datenbank],
    }).compileComponents();

    fixture = TestBed.createComponent(Datenbank);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
