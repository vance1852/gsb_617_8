const express = require('express');
const { nanoid } = require('nanoid');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  const page = parseInt(req.query.page || '1');
  const pageSize = parseInt(req.query.pageSize || '10');
  const search = req.query.search || '';
  const offset = (page - 1) * pageSize;

  try {
    let countQuery = 'SELECT COUNT(*) FROM links';
    let dataQuery = `
      SELECT id, short_code, long_url, remark, expires_at, max_clicks,
             click_count, is_active, created_at, updated_at
      FROM links
    `;
    const params = [];

    if (search) {
      countQuery += ' WHERE short_code ILIKE $1 OR long_url ILIKE $1 OR remark ILIKE $1';
      dataQuery += ' WHERE short_code ILIKE $1 OR long_url ILIKE $1 OR remark ILIKE $1';
      params.push(`%${search}%`);
    }

    dataQuery += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(pageSize, offset);

    const countResult = await pool.query(countQuery, search ? [`%${search}%`] : []);
    const dataResult = await pool.query(dataQuery, params);

    res.json({
      links: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      pageSize
    });
  } catch (err) {
    console.error('获取链接列表错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/', async (req, res) => {
  const { short_code, long_url, remark, expires_at, max_clicks } = req.body;

  if (!long_url) {
    return res.status(400).json({ error: '目标URL不能为空' });
  }

  try {
    new URL(long_url);
  } catch {
    return res.status(400).json({ error: '请输入有效的URL地址（需要包含http://或https://）' });
  }

  const code = short_code && short_code.trim() ? short_code.trim() : nanoid(8);

  if (!/^[a-zA-Z0-9_-]+$/.test(code)) {
    return res.status(400).json({ error: '短码只能包含字母、数字、下划线和连字符' });
  }

  try {
    const existing = await pool.query(
      'SELECT id FROM links WHERE short_code = $1',
      [code]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: '该短码已被使用，请换一个' });
    }

    const result = await pool.query(
      `INSERT INTO links (short_code, long_url, remark, expires_at, max_clicks)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [code, long_url, remark || null, expires_at || null, max_clicks ? parseInt(max_clicks) : null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('创建链接错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { long_url, remark, expires_at, max_clicks, short_code } = req.body;

  try {
    const existing = await pool.query('SELECT * FROM links WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: '链接不存在' });
    }

    if (short_code && short_code !== existing.rows[0].short_code) {
      const codeExists = await pool.query(
        'SELECT id FROM links WHERE short_code = $1 AND id != $2',
        [short_code, id]
      );
      if (codeExists.rows.length > 0) {
        return res.status(400).json({ error: '该短码已被使用' });
      }
    }

    const result = await pool.query(
      `UPDATE links
       SET short_code = $1, long_url = $2, remark = $3, expires_at = $4, max_clicks = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [
        short_code || existing.rows[0].short_code,
        long_url || existing.rows[0].long_url,
        remark !== undefined ? remark : existing.rows[0].remark,
        expires_at !== undefined ? (expires_at || null) : existing.rows[0].expires_at,
        max_clicks !== undefined ? (max_clicks ? parseInt(max_clicks) : null) : existing.rows[0].max_clicks,
        id
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('更新链接错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.put('/:id/toggle', async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await pool.query('SELECT is_active FROM links WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: '链接不存在' });
    }

    const result = await pool.query(
      'UPDATE links SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('切换状态错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await pool.query('SELECT id FROM links WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: '链接不存在' });
    }

    await pool.query('DELETE FROM links WHERE id = $1', [id]);
    res.json({ message: '删除成功' });
  } catch (err) {
    console.error('删除链接错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM links WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '链接不存在' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('获取链接详情错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
