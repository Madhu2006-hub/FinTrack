import { normalizeError } from './client';

describe('normalizeError', () => {
  it('explains a network failure when there is no response', () => {
    const result = normalizeError({ message: 'Network Error' });
    expect(result.status).toBe(0);
    expect(result.message).toMatch(/Cannot reach the server/);
  });

  it('uses the backend message and field errors when present', () => {
    const result = normalizeError({
      response: { status: 400, data: { message: 'Validation failed', fieldErrors: { title: 'Title is required.' } } },
    });
    expect(result.status).toBe(400);
    expect(result.message).toBe('Validation failed');
    expect(result.fieldErrors.title).toBe('Title is required.');
  });
});
