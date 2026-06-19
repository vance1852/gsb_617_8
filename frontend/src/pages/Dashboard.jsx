import React from "react";
import { Card, Row, Col, Statistic, Table, Typography, Space, Tag } from "antd";
import {
  LinkOutlined,
  EyeOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { Line } from "@ant-design/charts";
import http from "../http.js";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [overview, setOverview] = React.useState({
    totalLinks: 0,
    totalClicks: 0,
    todayClicks: 0,
    activeLinks: 0,
  });
  const [top, setTop] = React.useState([]);
  const [trend, setTrend] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [o, t, tr] = await Promise.all([
          http.get("/stats/overview"),
          http.get("/stats/top", { params: { limit: 10 } }),
          http.get("/stats/trend", { params: { days: 7 } }),
        ]);
        setOverview(o);
        setTop(t.items);
        setTrend(tr.trend);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const columns = [
    {
      title: "短码",
      dataIndex: "code",
      render: (v, r) => <Link to={`/links/${r.id}`}>{v}</Link>,
    },
    { title: "目标 URL", dataIndex: "targetUrl", ellipsis: true },
    { title: "点击数", dataIndex: "clickCount", width: 100 },
    {
      title: "状态",
      dataIndex: "enabled",
      width: 90,
      render: (v) =>
        v ? <Tag color="green">启用</Tag> : <Tag color="default">停用</Tag>,
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Row gutter={16}>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card" loading={loading}>
            <Statistic
              title="短链总数"
              value={overview.totalLinks}
              prefix={<LinkOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card" loading={loading}>
            <Statistic
              title="总点击数"
              value={overview.totalClicks}
              prefix={<EyeOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card" loading={loading}>
            <Statistic
              title="今日点击"
              value={overview.todayClicks}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card" loading={loading}>
            <Statistic
              title="活跃短链"
              value={overview.activeLinks}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="近 7 天点击趋势" loading={loading}>
        <Line
          data={trend}
          xField="date"
          yField="count"
          height={260}
          point={{ shape: "circle", size: 3 }}
          smooth
          autoFit
        />
      </Card>

      <Card title="点击 Top 10" loading={loading}>
        <Table
          rowKey="id"
          dataSource={top}
          columns={columns}
          pagination={false}
          size="small"
        />
      </Card>
    </Space>
  );
}
