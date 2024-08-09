const db = require('../db/connection');
const multer = require('multer');
const bcrypt = require('bcrypt');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profile/'); // Specify the destination directory
  },
  filename: function (req, file, cb) {
    cb(null, `${req.user.id}.png`); // Specify the file name
  }
});

const upload = multer({ storage: storage });

// แก้ไขโปรไฟล์
exports.editProfile = (req, res) => {
  const userId = req.user.id; // มาจาก middleware auth
  const { name, password } = req.body;
  const img = req.file ? req.file.filename : null; // Get the uploaded image filename if available

  // ตรวจสอบว่ามีการอัปเดตอย่างน้อยหนึ่งค่า
  if (!name && !img && !password) {
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลสำหรับการอัปเดต' });
  }

  const fields = [];
  const values = [];

  // ตรวจสอบว่ามีค่า name ที่ส่งเข้ามาหรือไม่
  if (name) {
    fields.push('name = ?');
    values.push(name);
  }

  // ตรวจสอบว่ามีค่า img ที่ส่งเข้ามาหรือไม่
  if (img) {
    fields.push('img = ?');
    values.push(img);
  }

  // ตรวจสอบว่ามีค่า password ที่ส่งเข้ามาหรือไม่
  if (password) {
    // ตรวจสอบความยาวของรหัสผ่าน
    if (password.length < 8) {
      return res.status(400).json({ error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10); // Hash the new password
    fields.push('password = ?');
    values.push(hashedPassword);
  }

  values.push(userId);

  // Update query dynamically based on fields
  const query = `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`;
  db.query(query, values, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).send('เซิฟเวอร์มีปัญหา');
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
    }

    res.json({ message: 'แก้ไขโปรไฟล์สำเร็จ' });
  });
};

// Expose multer upload as middleware for routes
exports.upload = upload;
