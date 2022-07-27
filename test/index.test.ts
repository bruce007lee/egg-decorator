import mock from 'egg-mock';
import assert = require('assert');

describe('index', async () => {
  afterEach(mock.restore);

  it('should work', async () => {
    const app = mock.app({ baseDir: 'app' });
    await app.ready();
    // const ctx = app.mockContext();
    /* @ts-ignore */
    assert(app.config.decorator);
  });
});
