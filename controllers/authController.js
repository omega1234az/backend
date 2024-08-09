const db = require('../db/connection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], async (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).send('เซิฟเวอร์มีปัญหา');
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const token = jwt.sign({ id: user.user_id, email: user.email }, 'omega', {
      expiresIn: '24h'
    });
    console.log(email, 'เข้าสู่ระบบสำเร็จแล้ว');
    res.json({ success: true, token });
  });
};

// ลงทะเบียน
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  // ตรวจสอบข้อมูลที่กรอก
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'กรอกข้อมูลให้ครบ' });
  }

  // ตรวจสอบรูปแบบของรหัสผ่าน
  if (password.length < 6) {
    return res.status(400).json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
  }

  const checkUserQuery = 'SELECT * FROM users WHERE email = ?';
  db.query(checkUserQuery, [email], async (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).send('เซิฟเวอร์มีปัญหา');
    }

    if (results.length > 0) {
      return res.status(400).json({ error: 'อีเมลนี้มีการใช้งานแล้ว' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertUserQuery = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
    db.query(insertUserQuery, [name, email, hashedPassword], (err, results) => {
      if (err) {
        console.error('Error executing query:', err);
        return res.status(500).send('เซิฟเวอร์มีปัญหา');
      }

      res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ' });
    });
  });
};


exports.getUser = (req, res) => {
  const userId = req.user.id; // มาจาก middleware auth

  const query = 'SELECT user_id, name, email, img FROM users WHERE user_id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).send('เซิฟเวอร์มีปัญหา');
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
    }

    res.json(results[0]);
  });
};
