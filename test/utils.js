import sinon from 'sinon';

export function createMockConfig() {
  return {
    get: sinon.stub().returns(''),
  };
}