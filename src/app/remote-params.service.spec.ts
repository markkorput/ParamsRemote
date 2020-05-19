import { TestBed } from '@angular/core/testing';

import { RemoteParamsService, Param } from './remote-params.service';

describe('RemoteParamsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  xit('should be created', () => {
    const service: RemoteParamsService = TestBed.get(RemoteParamsService);
    expect(service).toBeTruthy();
  });
});

describe('Boolean param', () => {
  it('should recognise various value formats', () => {
    const p = new Param('/foo/bar', 'b', false, {});
    expect(p.value).toEqual(false);

    p.set(true);
    expect(p.value).toEqual(true);
    p.set(false);
    expect(p.value).toEqual(false);

    p.set('True');
    expect(p.value).toEqual(true);
    p.set('False');
    expect(p.value).toEqual(false);

    p.set(1);
    expect(p.value).toEqual(true);
    p.set(0);
    expect(p.value).toEqual(false);

    p.set('1');
    expect(p.value).toEqual(true);
    p.set('0');
    expect(p.value).toEqual(false);
  });
});