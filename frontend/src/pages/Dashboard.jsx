import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Typography } from 'antd';
import { LinkOutlined, EyeOutlined, RiseOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { statsApi } from '../api/request';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await statsApi.dashboard();
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  const topColumns = [
    {
      title: '短码',
      dataIndex: 'short_code',
      key: 'short_code',
      render: (code) => <Tag color="blue">{code}</Tag>
    },
    {
      title: '目标URL',
      dataIndex: 'long_url',
      key: 'long_url',
      ellipsis: true,
      render: (url) => (
        <a href={url} target="_blank" rel="noreferrer" style={{ maxWidth: 300, display: 'inline-block' }}>
          {url}
        </a>
      )
    },
    {
      title: '点击数',
      dataIndex: 'clicks',
      key: 'clicks',
      width: 100,
      sorter: (a, b) => a.clicks - b.clicks
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (active, record) => {
        const expired = record.expires_at && dayjs(record.expires_at).isBefore(dayjs());
        const maxReached = record.max_clicks !== null && record.clicks >= record.max_clicks;
        if (!active) return <Tag color="red">已停用</Tag>;
        if (expired) return <Tag color="orange">已过期</Tag>;
        if (maxReached) return <Tag color="orange">已达上限</Tag>;
        return <Tag color="green">正常</Tag>;
      }
    }
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>数据概览</Title>

      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="短链总数"
              value={data?.totalLinks || 0}
              prefix={<LinkOutlined style={{ color: '#667eea' }} />}
              valueStyle={{ color: '#667eea' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃短链"
              value={data?.activeLinks || 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总点击数"
              value={data?.totalClicks || 0}
              prefix={<EyeOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日点击"
              value={data?.todayClicks || 0}
              prefix={<RiseOutlined style={{ color: '#f5222d' }} />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="近7天访问趋势" style={{ marginTop: 24 }} loading={loading}>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.last7Days || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(d) => dayjs(d).format('MM-DD')} />
              <YAxis allowDecimals={false} />
              <Tooltip labelFormatter={(d) => dayjs(d).format('YYYY-MM-DD')} />
              <Line type="monotone" dataKey="count" name="访问量" stroke="#667eea" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="访问量 TOP 10 短链" style={{ marginTop: 24 }}>
        <Table
          columns={topColumns}
          dataSource={data?.topLinks || []}
          rowKey="id"
          pagination={false}
          size="middle"
        />
      </Card>
    </div>
  );
}
