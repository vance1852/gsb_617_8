import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Descriptions, Space, Button } from 'antd';
import { ArrowLeftOutlined, CopyOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import api from '../utils/api';
import { message } from 'antd';

function Stats() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/shorturls/${id}/stats`);
      setData(res);
    } catch (error) {
      message.error('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const shortUrl = `${window.location.origin}/s/${data.shortUrl?.shortCode}`;
    navigator.clipboard.writeText(shortUrl);
    message.success('短链接已复制');
  };

  const chartOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: (data.dailyStats || []).map(item => dayjs(item.date).format('YYYY-MM-DD'))
    },
    yAxis: { type: 'value' },
    series: [{
      name: '点击量',
      type: 'bar',
      data: (data.dailyStats || []).map(item => item.count),
      itemStyle: { color: '#1890ff' }
    }]
  };

  const logColumns = [
    {
      title: '访问时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '来源',
      dataIndex: 'referer',
      key: 'referer',
      ellipsis: true,
      render: (ref) => ref ? (
        <a href={ref} target="_blank" rel="noopener noreferrer">{ref}</a>
      ) : <span style={{ color: '#999' }}>直接访问</span>
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      key: 'ip',
      width: 140,
      render: (ip) => ip || '-'
    },
    {
      title: 'User Agent',
      dataIndex: 'userAgent',
      key: 'userAgent',
      ellipsis: true,
      render: (ua) => ua || '-'
    }
  ];

  if (loading) {
    return <div>加载中...</div>;
  }

  const { shortUrl } = data;

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/shorturls')}>返回列表</Button>
      </Space>

      <Card title="短链信息" style={{ marginBottom: 24 }}>
        <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} bordered>
          <Descriptions.Item label="短码">
            <Space>
              <Tag color="blue">{shortUrl?.shortCode}</Tag>
              <Button type="link" size="small" icon={<CopyOutlined />} onClick={handleCopy}>复制链接</Button>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="总点击数">
            <span style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
              {shortUrl?.clickCount || 0}
              {shortUrl?.maxClicks ? ` / ${shortUrl.maxClicks}` : ''}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={shortUrl?.isActive ? 'green' : 'default'}>
              {shortUrl?.isActive ? '启用' : '停用'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="目标链接" span={3}>
            <a href={shortUrl?.longUrl} target="_blank" rel="noopener noreferrer">
              {shortUrl?.longUrl}
            </a>
          </Descriptions.Item>
          <Descriptions.Item label="过期时间">
            {shortUrl?.expiresAt ? dayjs(shortUrl.expiresAt).format('YYYY-MM-DD HH:mm') : '永久有效'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(shortUrl?.createdAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="备注">
            {shortUrl?.remark || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Row gutter={16}>
        <Col span={24}>
          <Card title="按天访问趋势" style={{ marginBottom: 24 }}>
            <ReactECharts option={chartOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Card title="最近访问记录">
        <Table
          columns={logColumns}
          dataSource={data.recentLogs || []}
          rowKey="id"
          pagination={false}
          size="small"
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
}

export default Stats;
