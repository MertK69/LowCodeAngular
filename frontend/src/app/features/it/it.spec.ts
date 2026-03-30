import { ComponentFixture, TestBed } from '@angular/core/testing';

import { It } from './it';

describe('It', () => {
  let component: It;
  let fixture: ComponentFixture<It>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [It],
    }).compileComponents();

    fixture = TestBed.createComponent(It);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
