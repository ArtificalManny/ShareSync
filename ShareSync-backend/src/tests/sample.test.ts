describe('Sample Test Suite', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should work with strings', () => {
    const message = 'ShareSync';
    expect(message).toContain('Share');
  });

  it('should work with objects', () => {
    const user = { name: 'Manny', role: 'developer' };
    expect(user).toHaveProperty('name', 'Manny');
  });
});
