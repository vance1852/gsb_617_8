import React from "react";
import { Form, Input, Button, Card, Typography, message } from "antd";
import { UserOutlined, LockOutlined, LinkOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import http from "../http.js";
import { useAuthStore } from "../store.js";

const { Title, Text } = Typography;

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [loading, setLoading] = React.useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await http.post("/auth/login", values);
      login(res.token, res.user);
      message.success("登录成功");
      navigate("/", { replace: true });
    } catch (e) {
      // already handled
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <Card
        className="login-card"
        bordered={false}
        style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <LinkOutlined style={{ fontSize: 32, color: "#1677ff" }} />
          <Title level={3} style={{ marginTop: 8, marginBottom: 0 }}>
            短链接管理后台
          </Title>
          <Text type="secondary">请使用管理员账号登录</Text>
        </div>
        <Form
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ username: "", password: "" }}
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: "请输入用户名" }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              autoComplete="username"
            />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: "请输入密码" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              autoComplete="current-password"
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
