import React from 'react';
import { Card, Descriptions, Tag, Table, Space, Button, Typography, Spin } from 'antd';
import { ArrowLeftOutlined, CopyOutlined } from '@ant-design/icons';
import { Line } from '@ant-design/charts';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import http from '../http.js';

const { Text } = Typography;
const PUBLIC_BASE = window.location.origin;

export default function LinkDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [detail, setDetail] = React.useState(null);

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await http.get(`/links/${id}`);
        setDetail(res);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading || !detail) {
    return <Spin />;
  }

  const { link, trend, recent } = detail;
  const shortUrl = `${PUBLIC_BASE}/r/${link.code}`;
  const remaining = link.maxClicks == null ? '不限' : Math.max(link.maxClicks - link.clickCount, 0);

  const copy = () => {
    navigator.clipboard.writeText(shortUrl);
  };

  const recentColumns = [
    {
      title: '访问时间',
      dataIndex: 'createdAt',
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm:ss'),
      width: 180,
    },
    { title: '来源 Referer', dataIndex: 'referer', ellipsis: true, render: (v) => v || <Text type="secondary">-</Text> },
    { title: 'User-Agent', dataIndex: 'userAgent', ellipsis: true, render: (v) => v || <Text type="secondary">-</Text> },
    { title: 'IP', dataIndex: 'ip', width: 160, render: (v) => v || <Text type="secondary">-</Text> },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>
      <Card title="短链详情">
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="短码">{link.code}</Descriptions.Item>
          <Descriptions.Item label="状态">
            {link.enabled ? <Tag color="green">启用</Tag> : <Tag>停用</Tag>}
          </Descriptions.Item>
          <Descriptions.Item label="短链" span={2}>
            <Space>
              <a href={shortUrl} target="_blank" rel="noreferrer">{shortUrl}</a>
              <Button size="small" icon={<CopyOutlined />} onClick={copy}>复制</Button>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="目标 URL" span={2}>
            <a href={link.targetUrl} target="_blank" rel="noreferrer">{link.targetUrl}</a>
          </Descriptions.Item>
          <Descriptions.Item label="总点击数">{link.clickCount}</Descriptions.Item>
          <Descriptions.Item label="点击上限 / 剩余">
            {(link.maxClicks ?? '不限')} / {remaining}
          </Descriptions.Item>
          <Descriptions.Item label="过期时间">
            {link.expiresAt ? dayjs(link.expiresAt).format('YYYY-MM-DD HH:mm') : '永不过期'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(link.createdAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="备注" span={2}>{link.remark || <Text type="secondary">无</Text>}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="近 30 天点击趋势">
        <Line
          data={trend}
          xField="date"
          yField="count"
          height={260}
          smooth
          autoFit
          point={{ shape: 'circle', size: 3 }}
        />
      </Card>

      <Card title="最近 50 条访问记录">
        <Table
          rowKey="id"
          dataSource={recent}
          columns={recentColumns}
          size="small"
          pagination={false}
        />
      </Card>
    </Space>
  );
}
