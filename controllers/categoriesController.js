const db = require('../db/connection');

// ฟังก์ชันดึงข้อมูลหมวดหมู่หลักและหมวดหมู่ย่อย
exports.getCategories = (req, res) => {
  const cateId = req.params.id;

  let query = `
    SELECT 
      c.cate_id AS category_id, 
      c.name AS category_name, 
      c.img AS category_img,
      s.sub_cate_id AS sub_cate_id, 
      s.name AS subcategory_name,
      IFNULL(s.img, 'default.png') AS subcategory_img
    FROM 
      categories c
    LEFT JOIN 
      subcategories s ON c.cate_id = s.cate_id
  `;

  if (cateId) {
    query += ' WHERE c.cate_id = ?';
  }

  db.query(query, [cateId].filter(Boolean), (err, results) => {
    if (err) {
      console.error('Error fetching categories:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    // จัดกลุ่มข้อมูลตามหมวดหมู่หลัก
    const categories = {};
    results.forEach(row => {
      if (!categories[row.category_id]) {
        categories[row.category_id] = {
          category_id: row.category_id,
          category_name: row.category_name,
          category_img: row.category_img,
          subcategories: []
        };
      }

      if (row.sub_cate_id) {
        categories[row.category_id].subcategories.push({
          sub_cate_id: row.sub_cate_id,
          name: row.subcategory_name,
          img: row.subcategory_img
        });
      }
    });

    res.status(200).json(Object.values(categories));
  });
};

// ฟังก์ชันค้นหา subcategories
// controllers/searchController.js
exports.searchCategoriesAndSubcategories = (req, res) => {
  const keyword = req.query.keyword || '';
  const query = `
    SELECT 
      'category' AS type, 
      cate_id AS id, 
      name, 
      CONCAT('http://localhost:8000/uploads/categories/', img) AS img_url
    FROM 
      categories
    WHERE 
      name LIKE ?
    UNION
    SELECT 
      'subcategory' AS type, 
      sub_cate_id AS id, 
      name, 
      CONCAT('http://localhost:8000/uploads/subcategories/', img) AS img_url
    FROM 
      subcategories
    WHERE 
      name LIKE ?
  `;

  db.query(query, [`%${keyword}%`, `%${keyword}%`], (err, results) => {
    if (err) {
      console.error('Error searching categories and subcategories:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    res.status(200).json(results);
  });
};





// ฟังก์ชันค้นหา subcategories ที่ได้รับความนิยม
exports.getPopularSubCategories = (req, res) => {
  const limit = parseInt(req.query.limit) || 5;
  const query = `
    SELECT 
      sc.sub_cate_id, sc.name, sc.img, COUNT(ps.post_id) AS post_count
    FROM 
      subcategories sc
    LEFT JOIN 
      post_subcategories ps ON sc.sub_cate_id = ps.sub_cate_id
    LEFT JOIN 
      posts p ON ps.post_id = p.post_id
    GROUP BY 
      sc.sub_cate_id
    ORDER BY 
      post_count DESC
    LIMIT ?
  `;

  db.query(query, [limit], (err, results) => {
    if (err) {
      console.error('Error fetching popular subcategories:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (results.length === 0) {
      console.warn('No popular subcategories found.');
    }

    res.status(200).json(results);
  });
};

// ฟังก์ชันดึงข้อมูลหมวดหมู่ย่อยตาม sub_cate_id
exports.getSubcategoryById = (req, res) => {
  const subCategoryId = parseInt(req.params.sub_cate_id);

  const query = `
    SELECT sub_cate_id, name, img
    FROM subcategories
    WHERE sub_cate_id = ?
  `;

  db.query(query, [subCategoryId], (err, results) => {
    if (err) {
      console.error('Error fetching subcategory:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (results.length > 0) {
      res.status(200).json(results[0]);
    } else {
      res.status(404).json({ error: 'Subcategory not found' });
    }
  });
};
