import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Space, Table, Typography, message } from 'antd';
import { ArrowLeftOutlined, CopyOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { linksApi } from '../api/request';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function LinkDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [link, setLink] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const res = await linksApi.get(id);
      setLink(res);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    message.success('已复制到剪贴板');
  };

  const getRedirectUrl = (code) => {
    const base = window.location.origin;
    return `${base}/r/${code}`;
  };

  const visitColumns = [
    {
      title: '访问时间',
      dataIndex: 'visited_at',
      key: 'visited_at',
      width: 180,
      render: (d) => dayjs(d).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '来源',
      dataIndex: 'referer',
      key: 'referer',
      ellipsis: true,
      render: (r) => r || <Tag color="default">直接访问</Tag>
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      key: 'ip',
      width: 140,
      render: (ip) => {
        if (!ip) return '-';
        const parts = ip.split(':');
        return parts[parts.length - 1] || ip;
      }
    },
    {
      title: 'User-Agent',
      dataIndex: 'user_agent',
      key: 'user_agent',
      ellipsis: true,
      render: (ua) => ua || '-'
    }
  ];

  const getStatusTag = (record) => {
    if (!record) return null;
    const expired = record.expires_at && dayjs(record.expires_at).isBefore(dayjs());
    const maxReached = record.max_clicks !== null && record.clicks >= record.max_clicks;
    if (!record.is_active) return <Tag color="red">已停用</Tag>;
    if (expired) return <Tag color="orange">已过期</Tag>;
    if (maxReached) return <Tag color="orange">已达上限</Tag>;
    return <Tag color="green">正常</Tag>;
  };

  if (loading) {
    return <Card loading={loading} />;
  }

  if (!link) {
    return <Card><p>短链不存在</p></Card>;
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/links')}>
          返回列表
        </Button>
      </div>

      <Title level={4}>短链详情</Title>

      <Card style={{ marginBottom: 24 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="短码">
            <Space>
              <Tag color="blue" style={{ fontFamily: 'monospace', fontSize: 14 }}>{link.short_code}</Tag>
              <Button
                type="link"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(getRedirectUrl(link.short_code))}
              >
                复制短链
              </Button>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="短链地址">
            <a href={getRedirectUrl(link.short_code)} target="_blank" rel="noreferrer">
              {getRedirectUrl(link.short_code)}
            </a>
          </Descriptions.Item>
          <Descriptions.Item label="目标URL" span={2}>
            <a href={link.long_url} target="_blank" rel="noreferrer">{link.long_url}</a>
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            {getStatusTag(link)}
          </Descriptions.Item>
          <Descriptions.Item label="总点击数">
            <span style={{ fontSize: 18, fontWeight: 'bold', color: '#667eea' }}>{link.clicks}</span>
          </Descriptions.Item>
          <Descriptions.Item label="过期时间">
            {link.expires_at ? dayjs(link.expires_at).format('YYYY-MM-DD HH:mm:ss') : '永不过期'}
          </Descriptions.Item>
          <Descriptions.Item label="点击上限">
            {link.max_clicks !== null ? `${link.max_clicks} 次` : '不限'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(link.created_at).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {dayjs(link.updated_at).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
          {link.note && (
            <Descriptions.Item label="备注" span={2}>{link.note}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card title="近30天访问趋势" style={{ marginBottom: 24 }}>
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={link.dailyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(d) => dayjs(d).format('MM-DD')} />
              <YAxis allowDecimals={false} />
              <Tooltip
                labelFormatter={(d) => dayjs(d).format('YYYY-MM-DD')}
                formatter={(value) => [value, '访问量']}
              />
              <Bar dataKey="count" name="访问量" fill="#667eea" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="最近访问记录">
        <Table
          columns={visitColumns}
          dataSource={link.recentVisits}
          rowKey="id"
          size="middle"
          pagination={false}
        />
      </Card>
    </div>
  );
}
