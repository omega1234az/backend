const db = require('../db/connection');

// ฟังก์ชันดึงข้อมูลหมวดหมู่หลัก
exports.getCategories = (req, res) => {
  const cateId = req.params.id;

  if (cateId === undefined) {
    // ดึงข้อมูลหมวดหมู่หลักทั้งหมด
    const query = `
      SELECT 
        cate_id, name 
      FROM 
        categories
    `;

    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching categories:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      res.status(200).json(results);
    });
  } else {
    // ดึงข้อมูลหมวดหมู่ย่อยตาม cate_id
    if (isNaN(cateId)) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }

    const query = `
      SELECT 
        sub_cate_id, name 
      FROM 
        subcategories
      WHERE 
        cate_id = ?
    `;

    db.query(query, [cateId], (err, results) => {
      if (err) {
        console.error('Error fetching subcategories:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      res.status(200).json(results);
    });
  }
};


// ฟังก์ชันค้นหา subcategories
exports.searchSubCategories = (req, res) => {
  const keyword = req.query.keyword || ''; // คำค้นหา
  const query = `
    SELECT 
      sub_cate_id, name 
    FROM 
      subcategories
    WHERE 
      name LIKE ?
  `;

  db.query(query, [`%${keyword}%`], (err, results) => {
    if (err) {
      console.error('Error searching subcategories:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    res.status(200).json(results);
  });
};

// ฟังก์ชันค้นหา subcategories ที่ได้รับความนิยม
exports.getPopularSubCategories = (req, res) => {
  const limit = parseInt(req.query.limit) || 5; // จำนวน subcategories ที่จะดึง
  const query = `
    SELECT 
      sc.sub_cate_id, sc.name, COUNT(p.post_id) AS post_count
    FROM 
      subcategories sc
    LEFT JOIN 
      posts p ON sc.sub_cate_id = p.sub_cate_id
    GROUP BY 
      sc.sub_cate_id
    ORDER BY 
      post_count DESC
    LIMIT ?`;

  db.query(query, [limit], (err, results) => {
    if (err) {
      console.error('Error fetching popular subcategories:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    res.status(200).json(results);
  });
};