const db = require('../db/connection');
const multer = require('multer');
const path = require('path');

// ฟังก์ชันดึงโพสต์ทั้งหมด
exports.getAllPosts = (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const query = `
    SELECT 
      p.post_id, p.title, p.content, p.img, p.create_at, 
      p.post_user_id, u.name AS user_name, u.img AS user_img,
      GROUP_CONCAT(sc.name) AS sub_cate_names, 
      (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.post_id) AS comment_count
    FROM 
      posts p
    JOIN 
      users u ON p.post_user_id = u.user_id
    LEFT JOIN
      post_subcategories ps ON p.post_id = ps.post_id
    LEFT JOIN
      subcategories sc ON ps.sub_cate_id = sc.sub_cate_id
    GROUP BY 
      p.post_id, p.title, p.content, p.img, p.create_at, 
      p.post_user_id, u.name, u.img
    ORDER BY 
      p.create_at DESC
    LIMIT ?;
  `;

  db.query(query, [limit], (err, results) => {
    if (err) {
      console.error('Error fetching posts:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    res.status(200).json(results);
  });
};

// ฟังก์ชันดึงโพสต์ตาม ID
exports.getPostById = (req, res) => {
  const postId = req.params.id;

  const querySelectPost = `
    SELECT 
      p.post_id, p.title, p.content, p.img, p.create_at, 
      p.post_user_id, u.name AS user_name, u.img AS user_img
    FROM 
      posts p
    JOIN 
      users u ON p.post_user_id = u.user_id
    WHERE 
      p.post_id = ?;
  `;

  const querySelectSubCategories = `
    SELECT 
      sc.cate_id, sc.sub_cate_id, sc.name AS subcatename
    FROM 
      post_subcategories ps
    JOIN
      subcategories sc ON ps.sub_cate_id = sc.sub_cate_id
    WHERE 
      ps.post_id = ?;
  `;

  db.query(querySelectPost, [postId], (err, postResults) => {
    if (err) {
      console.error('Error fetching post:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (postResults.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const post = postResults[0];

    db.query(querySelectSubCategories, [postId], (err, subCategoryResults) => {
      if (err) {
        console.error('Error fetching subcategories:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      post.sub_cate_info = subCategoryResults.map(sub => ({
        cate_id: sub.cate_id,
        subcate_id: sub.sub_cate_id,
        subcatename: sub.subcatename
      }));

      res.status(200).json(post);

      db.query('UPDATE posts SET view_count = view_count + 1 WHERE post_id = ?', [postId], (err) => {
        if (err) {
          console.error('Error updating view count:', err);
        }
      });
    });
  });
};

// ตั้งค่า storage สำหรับ multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/posts'); // โฟลเดอร์สำหรับเก็บไฟล์อัพโหลด
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // กำหนดชื่อไฟล์เป็น timestamp ตามด้วยนามสกุลเดิม
  },
});

const upload = multer({ storage: storage });

// ฟังก์ชันสร้างโพสต์
exports.createPost = (req, res) => {
  upload.single('img')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: 'การอัพโหลดรูปภาพล้มเหลว' });
    }

    const { title, content, sub_cate_ids } = req.body;
    const post_user_id = req.user.id;
    const img = req.file ? req.file.filename : null;

    if (!title || !content) {
      return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    // แปลง sub_cate_ids เป็น array ถ้าจำเป็น
    const subCateIds = Array.isArray(sub_cate_ids) ? sub_cate_ids : JSON.parse(sub_cate_ids);

    const query = 'INSERT INTO posts (title, content, img, post_user_id) VALUES (?, ?, ?, ?)';
    db.query(query, [title, content, img, post_user_id], (err, results) => {
      if (err) {
        console.error('Error creating post:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      const post_id = results.insertId;

      // ถ้ามี sub_cate_ids ให้ใช้ for loop เพื่อเพิ่มหมวดหมู่ย่อย
      if (subCateIds.length > 0) {
        let insertCount = 0;
        let insertError = false;

        subCateIds.forEach(sub_cate_id => {
          const subCateQuery = 'INSERT INTO post_subcategories (post_id, sub_cate_id) VALUES (?, ?)';

          db.query(subCateQuery, [post_id, sub_cate_id], (err) => {
            if (err) {
              console.error('Error associating post with subcategory:', err);
              insertError = true;
              // ไม่หยุดการทำงาน แต่ยังคงบันทึก error
            }

            insertCount++;
            if (insertCount === subCateIds.length) {
              // ตรวจสอบว่าเกิดข้อผิดพลาดหรือไม่
              if (insertError) {
                return res.status(500).json({ error: 'Internal server error while associating subcategories' });
              }
              res.status(201).json({ message: 'Post created successfully', post_id: post_id });
            }
          });
        });
      } else {
        res.status(201).json({ message: 'Post created successfully without subcategories', post_id: post_id });
      }
    });
  });
};


// ฟังก์ชันอัปเดตโพสต์
exports.updatePost = (req, res) => {
  const postId = req.params.id;
  const { title, content, img, sub_cate_id } = req.body;
  const query = 'UPDATE posts SET title = ?, content = ?, img = ?, sub_cate_id = ? WHERE post_id = ?';

  db.query(query, [title, content, img, sub_cate_id, postId], (err, results) => {
    if (err) {
      console.error('Error updating post:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    res.status(200).json({ message: 'Post updated successfully' });
  });
};

// ฟังก์ชันลบโพสต์
exports.deletePost = (req, res) => {
  const postId = req.params.id;
  const query = 'DELETE FROM posts WHERE post_id = ?';

  db.query(query, [postId], (err, results) => {
    if (err) {
      console.error('Error deleting post:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    res.status(200).json({ message: 'Post deleted successfully' });
  });
};
// ฟังก์ชันดึงโพสต์ตามหมวดหมู่
exports.getPostsByCategory = (req, res) => {
  const categoryId = req.params.categoryId;
  const limit = parseInt(req.query.limit) || 10;

  const query = `
    SELECT 
      p.post_id, p.title, p.content, p.img, p.create_at, 
      p.post_user_id, u.name AS user_name, u.img AS user_img,
      GROUP_CONCAT(sc.name) AS sub_cate_names, 
      (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.post_id) AS comment_count
    FROM 
      posts p
    JOIN 
      users u ON p.post_user_id = u.user_id
    JOIN 
      post_subcategories ps ON p.post_id = ps.post_id
    JOIN 
      subcategories sc ON ps.sub_cate_id = sc.sub_cate_id
    WHERE 
      sc.cate_id = ?
    GROUP BY 
      p.post_id, p.title, p.content, p.img, p.create_at, 
      p.post_user_id, u.name, u.img
    ORDER BY 
      p.create_at DESC
    LIMIT ?;
  `;

  db.query(query, [categoryId, limit], (err, results) => {
    if (err) {
      console.error('Error fetching posts by category:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    res.status(200).json(results);
  });
};

exports.getPostsBySubcategory = (req, res) => {
  const subcategoryId = req.params.subcategoryId;
  const limit = parseInt(req.query.limit) || 10;

  const query = `
      SELECT p.post_id, p.title, p.content, p.img, p.create_at, 
             p.post_user_id, u.name AS user_name, u.img AS user_img,
             GROUP_CONCAT(sc.name) AS sub_cate_names, 
             (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.post_id) AS comment_count
      FROM posts p
      JOIN users u ON p.post_user_id = u.user_id
      JOIN post_subcategories ps ON p.post_id = ps.post_id
      JOIN subcategories sc ON ps.sub_cate_id = sc.sub_cate_id
      WHERE ps.sub_cate_id = ?
      GROUP BY p.post_id, p.title, p.content, p.img, p.create_at, 
               p.post_user_id, u.name, u.img
      ORDER BY p.create_at DESC
      LIMIT ?;
  `;

  db.query(query, [subcategoryId, limit], (err, results) => {
    if (err) {
      console.error('Error fetching posts by subcategory:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    res.status(200).json(results);
  });
};

// controllers/postsController.js


exports.searchPosts = (req, res) => {
  const query = req.params.query;

  if (!query) {
    return res.status(400).json({ message: 'กรุณาระบุคำค้นหา' });
  }

  const searchQuery = `
    SELECT 
      p.post_id, 
      p.title, 
      p.content, 
      p.img, 
      p.create_at, 
      p.view_count, 
      u.name AS post_user_name
    FROM 
      posts p
    LEFT JOIN 
      users u ON p.post_user_id = u.user_id
    WHERE 
      p.title LIKE ? OR p.content LIKE ?
  `;

  // ใช้ ? เพื่อป้องกัน SQL Injection
  const searchParams = [`%${query}%`, `%${query}%`];

  db.query(searchQuery, searchParams, (err, results) => {
    if (err) return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการค้นหาโพสต์' });
    res.json(results);
  });
};
// ฟังก์ชันบันทึกโพสต์
exports.savePost = (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;

  const checkQuery = 'SELECT * FROM save_posts WHERE post_id = ? AND save_user_id = ?';
  const insertQuery = 'INSERT INTO save_posts (post_id, save_user_id) VALUES (?, ?)';
  const deleteQuery = 'DELETE FROM save_posts WHERE post_id = ? AND save_user_id = ?';

  // ตรวจสอบว่าผู้ใช้ได้บันทึกโพสต์นี้ไว้แล้วหรือไม่
  db.query(checkQuery, [postId, userId], (err, results) => {
    if (err) {
      console.error('Error checking saved post:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบโพสต์ที่บันทึก' });
    }

    if (results.length > 0) {
      // ถ้าบันทึกไว้แล้วให้ลบออก
      db.query(deleteQuery, [postId, userId], (err) => {
        if (err) {
          console.error('Error deleting saved post:', err);
          return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบโพสต์ที่บันทึก' });
        }

        return res.status(200).json({ message: 'ลบโพสต์ออกจากการบันทึกเรียบร้อยแล้ว' });
      });
    } else {
      // ถ้ายังไม่ได้บันทึกให้เพิ่มเข้าไป
      db.query(insertQuery, [postId, userId], (err) => {
        if (err) {
          console.error('Error saving post:', err);
          return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึกโพสต์' });
        }

        return res.status(201).json({ message: 'บันทึกโพสต์เรียบร้อยแล้ว' });
      });
    }
  });
};


