import { TestBed } from '@angular/core/testing';

import { Training, TrainingService } from './training.service';

describe('TrainingService', () => {
  let service: TrainingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrainingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
