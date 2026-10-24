describe('GET /api', () => {
  it('should return a message', async () => {
    const baseUrl = process.env.API_URL ?? 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api`);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ message: 'Hello API' });
  });
});