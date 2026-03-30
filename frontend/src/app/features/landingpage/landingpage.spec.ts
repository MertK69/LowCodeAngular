import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Landingpage } from './landingpage';

describe('Landingpage', () => {
  let component: Landingpage;
  let fixture: ComponentFixture<Landingpage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Landingpage],
    }).compileComponents();

    fixture = TestBed.createComponent(Landingpage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
