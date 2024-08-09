const db = require('../db/connection');

// ฟังก์ชันดึงคอมเมนต์สำหรับโพสต์
exports.getCommentsByPostId = (req, res) => {
  const postId = req.params.postId;
  const query = `
    SELECT 
      c.comment_id, c.content, c.create_at, c.post_id, c.comment_user_id, 
      u.name AS user_name, u.img AS user_img,
      (SELECT COUNT(*) FROM reply_comments r WHERE r.comment_id = c.comment_id) AS reply_count
    FROM 
      comments c
    JOIN 
      users u ON c.comment_user_id = u.user_id
    WHERE 
      c.post_id = ?
    ORDER BY 
      c.create_at DESC
  `;

  db.query(query, [postId], (err, results) => {
    if (err) {
      console.error('Error fetching comments:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    res.status(200).json(results);
  });
};

// ฟังก์ชันดึงการตอบกลับสำหรับคอมเมนต์
exports.getRepliesByCommentId = (req, res) => {
  const commentId = req.params.commentId;
  const query = `
    SELECT 
      r.reply_id, r.content, r.create_at, r.comment_id, r.reply_user_id, 
      ur.name AS user_name, ur.img AS user_img
    FROM 
      reply_comments r
    JOIN 
      users ur ON r.reply_user_id = ur.user_id
    WHERE 
      r.comment_id = ?
    ORDER BY 
      r.create_at ASC
  `;

  db.query(query, [commentId], (err, results) => {
    if (err) {
      console.error('Error fetching replies:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    res.status(200).json(results);
  });
};

// ฟังก์ชันเพิ่มคอมเมนต์
exports.addComment = (req, res) => {
  const postId = req.params.postId;
  const { content } = req.body;
  const comment_user_id = req.user.id; // ดึง user_id จาก middleware auth

  if (!content) {
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  const query = 'INSERT INTO comments (content, post_id, comment_user_id) VALUES (?, ?, ?)';
  db.query(query, [content, postId, comment_user_id], (err, results) => {
    if (err) {
      console.error('Error adding comment:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    res.status(201).json({ message: 'Comment added successfully' });
  });
};

// ฟังก์ชันเพิ่มการตอบกลับ
exports.addReply = (req, res) => {
  const commentId = req.params.commentId;
  const { content } = req.body;
  const reply_user_id = req.user.id; // ดึง user_id จาก middleware auth

  if (!content) {
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  const query = 'INSERT INTO reply_comments (content, comment_id, reply_user_id) VALUES (?, ?, ?)';
  db.query(query, [content, commentId, reply_user_id], (err, results) => {
    if (err) {
      console.error('Error adding reply:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    res.status(201).json({ message: 'Reply added successfully' });
  });
};

// ฟังก์ชันแก้ไขคอมเมนต์
exports.updateComment = (req, res) => {
  const commentId = req.params.commentId;
  const { content } = req.body;
  const query = 'UPDATE comments SET content = ? WHERE comment_id = ?';

  db.query(query, [content, commentId], (err, results) => {
    if (err) {
      console.error('Error updating comment:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    res.status(200).json({ message: 'Comment updated successfully' });
  });
};

// ฟังก์ชันแก้ไขการตอบกลับ
exports.updateReply = (req, res) => {
  const replyId = req.params.replyId;
  const { content } = req.body;
  const query = 'UPDATE reply_comments SET content = ? WHERE reply_id = ?';

  db.query(query, [content, replyId], (err, results) => {
    if (err) {
      console.error('Error updating reply:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    res.status(200).json({ message: 'Reply updated successfully' });
  });
};

// ฟังก์ชันลบคอมเมนต์
exports.deleteComment = (req, res) => {
  const commentId = req.params.commentId;
  const query = 'DELETE FROM comments WHERE comment_id = ?';

  db.query(query, [commentId], (err, results) => {
    if (err) {
      console.error('Error deleting comment:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    res.status(200).json({ message: 'Comment deleted successfully' });
  });
};

// ฟังก์ชันลบการตอบกลับ
exports.deleteReply = (req, res) => {
  const replyId = req.params.replyId;
  const query = 'DELETE FROM reply_comments WHERE reply_id = ?';

  db.query(query, [replyId], (err, results) => {
    if (err) {
      console.error('Error deleting reply:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    res.status(200).json({ message: 'Reply deleted successfully' });
  });
};
