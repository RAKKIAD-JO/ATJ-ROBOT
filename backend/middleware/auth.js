const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Token ไม่ถูกต้อง" });

    req.userId = user.userId;
    req.isAdmin = user.isAdmin;
    next();
  });
}

module.exports = authenticateToken;