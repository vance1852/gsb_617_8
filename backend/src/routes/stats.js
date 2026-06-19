const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/dashboard', async (req, res) => {
  try {
    const totalLinksResult = await pool.query('SELECT COUNT(*) FROM links');
    const activeLinksResult = await pool.query("SELECT COUNT(*) FROM links WHERE is_active = TRUE");
    const totalClicksResult = await pool.query('SELECT COUNT(*) FROM clicks');
    const todayClicksResult = await pool.query(
      "SELECT COUNT(*) FROM clicks WHERE clicked_at >= CURRENT_DATE"
    );
    const topLinksResult = await pool.query(
      `SELECT l.id, l.short_code, l.long_url, l.remark, l.click_count
       FROM links l
       ORDER BY l.click_count DESC
       LIMIT 5`
    );

    const sevenDayTrendResult = await pool.query(
      `SELECT DATE(clicked_at) as date, COUNT(*) as count
       FROM clicks
       WHERE clicked_at >= CURRENT_DATE - INTERVAL '6 days'
       GROUP BY DATE(clicked_at)
       ORDER BY date ASC`
    );

    res.json({
      total_links: parseInt(totalLinksResult.rows[0].count),
      active_links: parseInt(activeLinksResult.rows[0].count),
      total_clicks: parseInt(totalClicksResult.rows[0].count),
      today_clicks: parseInt(todayClicksResult.rows[0].count),
      top_links: topLinksResult.rows,
      trend_7d: sevenDayTrendResult.rows
    });
  } catch (err) {
    console.error('获取面板统计错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/links/:id/clicks', async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page || '1');
  const pageSize = parseInt(req.query.pageSize || '20');
  const offset = (page - 1) * pageSize;

  try {
    const linkResult = await pool.query('SELECT id FROM links WHERE id = $1', [id]);
    if (linkResult.rows.length === 0) {
      return res.status(404).json({ error: '链接不存在' });
    }

    const clicksResult = await pool.query(
      `SELECT id, referer, user_agent, ip_address, clicked_at
       FROM clicks
       WHERE link_id = $1
       ORDER BY clicked_at DESC
       LIMIT $2 OFFSET $3`,
      [id, pageSize, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM clicks WHERE link_id = $1',
      [id]
    );

    const trendResult = await pool.query(
      `SELECT DATE(clicked_at) as date, COUNT(*) as count
       FROM clicks
       WHERE link_id = $1 AND clicked_at >= CURRENT_DATE - INTERVAL '6 days'
       GROUP BY DATE(clicked_at)
       ORDER BY date ASC`,
      [id]
    );

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const existing = trendResult.rows.find(r => {
        const rowDate = new Date(r.date).toISOString().split('T')[0];
        return rowDate === dateStr;
      });
      last7Days.push({
        date: dateStr,
        count: existing ? parseInt(existing.count) : 0
      });
    }

    res.json({
      clicks: clicksResult.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      pageSize,
      trend: last7Days
    });
  } catch (err) {
    console.error('获取点击统计错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
