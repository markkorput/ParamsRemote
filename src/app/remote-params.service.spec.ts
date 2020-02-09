import { TestBed } from '@angular/core/testing';

import { RemoteParamsService } from './remote-params.service';

describe('RemoteParamsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: RemoteParamsService = TestBed.get(RemoteParamsService);
    expect(service).toBeTruthy();
  });
});
