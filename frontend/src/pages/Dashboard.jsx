import { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Table, Typography, message } from 'antd'
import { LinkOutlined, EyeOutlined, RiseOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import dayjs from 'dayjs'
import { statsApi } from '../services/api'

const { Title } = Typography

export default function Dashboard() {
  const [overview, setOverview] = useState({ total_links: 0, active_links: 0, total_clicks: 0, today_clicks: 0 })
  const [trend, setTrend] = useState([])
  const [topLinks, setTopLinks] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const data = await statsApi.dashboard()
        setOverview({
          total_links: data.total_links || 0,
          active_links: data.active_links || 0,
          total_clicks: data.total_clicks || 0,
          today_clicks: data.today_clicks || 0
        })
        setTopLinks((data.top_links || []).map(l => ({
          id: l.id,
          short_code: l.short_code,
          long_url: l.long_url,
          remark: l.remark,
          click_count: l.click_count
        })))

        const trendMap = {}
        ;(data.trend_7d || []).forEach(r => {
          const dateStr = dayjs(r.date).format('MM-DD')
          trendMap[dateStr] = parseInt(r.count)
        })
        const days = []
        for (let i = 6; i >= 0; i--) {
          const dateStr = dayjs().subtract(i, 'day').format('MM-DD')
          days.push({ date: dateStr, count: trendMap[dateStr] || 0 })
        }
        setTrend(days)
      } catch (e) {
        console.error('加载仪表盘数据失败:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const columns = [
    { title: '排名', render: (_, __, i) => i + 1, width: 60 },
    { title: '短码', dataIndex: 'short_code', key: 'short_code', width: 100 },
    { title: '长链接', dataIndex: 'long_url', key: 'long_url', ellipsis: true },
    { title: '点击数', dataIndex: 'click_count', key: 'click_count', width: 80 }
  ]

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>仪表盘</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="短链总数" value={overview.total_links} prefix={<LinkOutlined />} valueStyle={{ color: '#1890ff' }} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="活跃短链" value={overview.active_links} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="总点击数" value={overview.total_clicks} prefix={<EyeOutlined />} valueStyle={{ color: '#722ed1' }} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="今日点击" value={overview.today_clicks} prefix={<RiseOutlined />} valueStyle={{ color: '#faad14' }} /></Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="最近7天点击趋势" loading={loading}>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#1890ff" strokeWidth={2} dot={{ fill: '#1890ff' }} name="点击数" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="点击 TOP5 短链" loading={loading}>
            <Table columns={columns} dataSource={topLinks} rowKey="id" pagination={false} size="small" />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
