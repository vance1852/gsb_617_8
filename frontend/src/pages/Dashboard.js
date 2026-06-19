import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag } from 'antd';
import { LinkOutlined, ClickOutlined, FireOutlined, RiseOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [data, setData] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/stats/dashboard');
      setData(res);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    }
  };

  const chartOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: (data.weeklyTrend || []).map(item => dayjs(item.date).format('MM-DD'))
    },
    yAxis: { type: 'value' },
    series: [{
      name: '点击量',
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.3 },
      data: (data.weeklyTrend || []).map(item => item.count),
      itemStyle: { color: '#1890ff' }
    }]
  };

  const columns = [
    {
      title: '短码',
      dataIndex: 'shortCode',
      key: 'shortCode',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: '目标链接',
      dataIndex: 'longUrl',
      key: 'longUrl',
      ellipsis: true,
      render: (url) => (
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ maxWidth: 300, display: 'inline-block' }}>
          {url}
        </a>
      )
    },
    {
      title: '点击数',
      dataIndex: 'clickCount',
      key: 'clickCount',
      sorter: (a, b) => a.clickCount - b.clickCount,
      render: (count) => <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{count}</span>
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active) => (
        <Tag color={active ? 'green' : 'default'}>{active ? '启用' : '停用'}</Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <a onClick={() => navigate(`/stats/${record.id}`)}>查看统计</a>
      )
    }
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="短链总数"
              value={data.totalShortUrls || 0}
              prefix={<LinkOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总点击数"
              value={data.totalClicks || 0}
              prefix={<ClickOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日点击"
              value={data.todayClicks || 0}
              prefix={<FireOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="近7天趋势"
              value={(data.weeklyTrend || []).reduce((sum, item) => sum + item.count, 0)}
              prefix={<RiseOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={14}>
          <Card title="近7天点击趋势" style={{ marginBottom: 24 }}>
            <ReactECharts option={chartOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="热门短链 TOP 10" style={{ marginBottom: 24 }}>
            <Table
              columns={columns}
              dataSource={data.topShortUrls || []}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
