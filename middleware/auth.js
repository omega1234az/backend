
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) 
    return res.status(401).json({ error: 'ไม่มีโทเค่น' });
  try {
    const decoded = jwt.verify(token, 'omega');
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).json({ error: 'โทเค่นไม่ถูกต้อง' });
  }
};
