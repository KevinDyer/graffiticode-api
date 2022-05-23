const request = require('supertest');
const { createApp } = require('../app');
const { TASK1, DATA1 } = require('../testing/fixture');
const { createSuccessResponse, createErrorResponse, createError } = require('./utils');

describe('routes/compile', () => {
  let app;
  beforeEach(() => {
    app = createApp();
  });

  it('should compile source', async () => {
    await request(app)
      .post('/compile')
      .send({ item: TASK1 })
      .expect(200, createSuccessResponse(DATA1));
  });

  it('should compile source with data', async () => {
    await request(app)
      .post('/compile')
      .send({ item: { ...TASK1, data: { foo: 'bar' } } })
      .expect(200, createSuccessResponse(DATA1));
  });

  it('should return invalid argument for no item', async () => {
    await request(app)
      .post('/compile')
      .send({ item: null })
      .expect(400, createErrorResponse(createError(400, 'item must be a non-null object')));
  });
});