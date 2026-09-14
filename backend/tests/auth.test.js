const authenticateToken = require('../middleware/auth');
const jwt = require('jsonwebtoken');

jest.mock('jsonwebtoken');

describe('authenticateToken Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { cookies: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    process.env.JWT_SECRET = 'test_secret';
  });

  it('should return 401 if no token is provided in cookies', () => {
    authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if token verification fails', () => {
    req.cookies.token = 'invalid_token';
    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(new Error('Invalid token'), null);
    });

    authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token ไม่ถูกต้อง' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should attach user info and call next if token is valid', () => {
    req.cookies.token = 'valid_token';
    const mockUser = { userId: '123', isAdmin: true };
    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(null, mockUser);
    });

    authenticateToken(req, res, next);
    expect(req.userId).toBe('123');
    expect(req.isAdmin).toBe(true);
    expect(next).toHaveBeenCalled();
  });
});
