import React from "react";
import {
  Layout as AntLayout,
  Menu,
  Dropdown,
  Avatar,
  Space,
  Typography,
} from "antd";
import {
  DashboardOutlined,
  LinkOutlined,
  UserOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store.js";

const { Header, Sider, Content } = AntLayout;

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = React.useState(false);

  const selectedKey = location.pathname.startsWith("/links") ? "/links" : "/";

  const menuItems = [
    { key: "/", icon: <DashboardOutlined />, label: "仪表盘" },
    { key: "/links", icon: <LinkOutlined />, label: "短链管理" },
  ];

  const userMenu = {
    items: [
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "退出登录",
        onClick: () => {
          logout();
          navigate("/login", { replace: true });
        },
      },
    ],
  };

  return (
    <AntLayout style={{ minHeight: "100vh" }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div className="app-logo">{collapsed ? "SL" : "短链管理"}</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <AntLayout>
        <Header
          style={{
            background: "#fff",
            padding: "0 24px",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <Dropdown menu={userMenu} placement="bottomRight">
            <Space style={{ cursor: "pointer" }}>
              <Avatar icon={<UserOutlined />} />
              <Typography.Text>{user?.username || "管理员"}</Typography.Text>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24 }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
