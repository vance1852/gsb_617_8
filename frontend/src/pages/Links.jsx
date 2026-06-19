import React from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Modal,
  Form,
  InputNumber,
  DatePicker,
  Switch,
  Popconfirm,
  message,
  Tooltip,
  Typography,
} from "antd";
import {
  PlusOutlined,
  CopyOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import http from "../http.js";

const { Text } = Typography;

const PUBLIC_BASE = window.location.origin;

export default function Links() {
  const [data, setData] = React.useState({ items: [], total: 0 });
  const [loading, setLoading] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [keyword, setKeyword] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [form] = Form.useForm();

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await http.get("/links", {
        params: { page, pageSize, keyword, status },
      });
      setData(res);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, status]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({
      targetUrl: record.targetUrl,
      code: record.code,
      expiresAt: record.expiresAt ? dayjs(record.expiresAt) : null,
      maxClicks: record.maxClicks ?? null,
      remark: record.remark || "",
    });
    setModalOpen(true);
  };

  const onSubmit = async () => {
    const values = await form.validateFields();
    const payload = {
      targetUrl: values.targetUrl,
      expiresAt: values.expiresAt ? values.expiresAt.toISOString() : null,
      maxClicks: values.maxClicks ?? null,
      remark: values.remark || null,
    };
    try {
      if (editing) {
        await http.put(`/links/${editing.id}`, payload);
        message.success("修改成功");
      } else {
        if (values.code) payload.code = values.code;
        await http.post("/links", payload);
        message.success("创建成功");
      }
      setModalOpen(false);
      fetchData();
    } catch (e) {
      // handled
    }
  };

  const toggleStatus = async (record, enabled) => {
    await http.patch(`/links/${record.id}/status`, { enabled });
    message.success(enabled ? "已启用" : "已停用");
    fetchData();
  };

  const onDelete = async (record) => {
    await http.delete(`/links/${record.id}`);
    message.success("已删除");
    fetchData();
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text).then(() => message.success("已复制"));
  };

  const columns = [
    {
      title: "短码",
      dataIndex: "code",
      width: 200,
      render: (code, r) => {
        const url = `${PUBLIC_BASE}/r/${code}`;
        return (
          <Space>
            <Link to={`/links/${r.id}`}>{code}</Link>
            <Tooltip title={url}>
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => copy(url)}
              />
            </Tooltip>
          </Space>
        );
      },
    },
    { title: "目标 URL", dataIndex: "targetUrl", ellipsis: true },
    {
      title: "点击 / 上限",
      width: 120,
      render: (_, r) => `${r.clickCount} / ${r.maxClicks ?? "∞"}`,
    },
    {
      title: "过期时间",
      dataIndex: "expiresAt",
      width: 170,
      render: (v) =>
        v ? (
          dayjs(v).format("YYYY-MM-DD HH:mm")
        ) : (
          <Text type="secondary">永不过期</Text>
        ),
    },
    {
      title: "状态",
      dataIndex: "enabled",
      width: 100,
      render: (v, r) => (
        <Switch
          checked={v}
          onChange={(c) => toggleStatus(r, c)}
          checkedChildren="启用"
          unCheckedChildren="停用"
        />
      ),
    },
    { title: "备注", dataIndex: "remark", ellipsis: true },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      width: 170,
      render: (v) => dayjs(v).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "操作",
      width: 160,
      render: (_, r) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(r)}
          >
            编辑
          </Button>
          <Popconfirm title="确定删除该短链？" onConfirm={() => onDelete(r)}>
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="短链管理"
      extra={
        <Space>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索短码 / URL / 备注"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={() => {
              setPage(1);
              fetchData();
            }}
            style={{ width: 240 }}
          />
          <Select
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            style={{ width: 120 }}
            options={[
              { value: "", label: "全部状态" },
              { value: "enabled", label: "已启用" },
              { value: "disabled", label: "已停用" },
            ]}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建短链
          </Button>
        </Space>
      }
    >
      <Table
        rowKey="id"
        loading={loading}
        dataSource={data.items}
        columns={columns}
        pagination={{
          current: page,
          pageSize,
          total: data.total,
          showSizeChanger: true,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />

      <Modal
        title={editing ? "编辑短链" : "新建短链"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={onSubmit}
        destroyOnClose
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            label="目标 URL"
            name="targetUrl"
            rules={[
              { required: true, message: "请输入目标 URL" },
              { type: "url", message: "请输入合法的 URL（含 http/https）" },
            ]}
          >
            <Input placeholder="https://example.com/path" />
          </Form.Item>
          {!editing && (
            <Form.Item
              label="自定义短码（可选，留空自动生成）"
              name="code"
              rules={[
                {
                  pattern: /^[A-Za-z0-9_-]{3,32}$/,
                  message: "3-32 位字母数字下划线或短横线",
                },
              ]}
            >
              <Input placeholder="留空自动生成" />
            </Form.Item>
          )}
          {editing && (
            <Form.Item label="短码">
              <Input value={editing.code} disabled />
            </Form.Item>
          )}
          <Form.Item label="过期时间（可选）" name="expiresAt">
            <DatePicker
              showTime
              style={{ width: "100%" }}
              placeholder="不设置即永不过期"
            />
          </Form.Item>
          <Form.Item label="最大点击次数（可选，留空不限）" name="maxClicks">
            <InputNumber
              min={1}
              style={{ width: "100%" }}
              placeholder="留空表示不限"
            />
          </Form.Item>
          <Form.Item label="备注（可选）" name="remark">
            <Input.TextArea rows={2} maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
