import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Trainings } from './trainings';

describe('Trainings', () => {
  let component: Trainings;
  let fixture: ComponentFixture<Trainings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Trainings]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Trainings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
