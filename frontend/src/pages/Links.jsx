import { useState, useEffect } from 'react';
import {
  Table, Button, Space, Input, Tag, Modal, Form, message,
  Popconfirm, DatePicker, InputNumber, Switch, Typography, Tooltip, Card
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, CopyOutlined, SearchOutlined,
  StopOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { linksApi } from '../api/request';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;

export default function Links() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [page, pageSize, search]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await linksApi.list({ page, pageSize, search });
      setData(res.list);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingLink(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingLink(record);
    form.setFieldsValue({
      ...record,
      expiresAt: record.expires_at ? dayjs(record.expires_at) : null
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    await linksApi.delete(id);
    message.success('删除成功');
    loadData();
  };

  const handleToggle = async (record) => {
    await linksApi.toggle(record.id);
    message.success(record.is_active ? '已停用' : '已启用');
    loadData();
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const submitData = {
        ...values,
        expiresAt: values.expiresAt ? values.expiresAt.format('YYYY-MM-DD HH:mm:ss') : null,
        maxClicks: values.maxClicks || null
      };

      if (editingLink) {
        await linksApi.update(editingLink.id, submitData);
        message.success('更新成功');
      } else {
        await linksApi.create(submitData);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (e) {
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

  const columns = [
    {
      title: '短码',
      dataIndex: 'short_code',
      key: 'short_code',
      width: 140,
      render: (code) => (
        <Space>
          <Tag color="blue" style={{ fontFamily: 'monospace', fontSize: 14 }}>{code}</Tag>
          <Tooltip title="复制短链">
            <CopyOutlined
              style={{ cursor: 'pointer', color: '#667eea' }}
              onClick={() => copyToClipboard(getRedirectUrl(code))}
            />
          </Tooltip>
        </Space>
      )
    },
    {
      title: '目标URL',
      dataIndex: 'long_url',
      key: 'long_url',
      ellipsis: true,
      render: (url) => (
        <a href={url} target="_blank" rel="noreferrer">{url}</a>
      )
    },
    {
      title: '备注',
      dataIndex: 'note',
      key: 'note',
      width: 150,
      ellipsis: true
    },
    {
      title: '点击/上限',
      key: 'clicks',
      width: 120,
      render: (_, record) => (
        <span>
          {record.clicks}
          {record.max_clicks !== null && ` / ${record.max_clicks}`}
        </span>
      )
    },
    {
      title: '过期时间',
      dataIndex: 'expires_at',
      key: 'expires_at',
      width: 160,
      render: (d) => d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '永不过期'
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'status',
      width: 100,
      render: (active, record) => {
        const expired = record.expires_at && dayjs(record.expires_at).isBefore(dayjs());
        const maxReached = record.max_clicks !== null && record.clicks >= record.max_clicks;
        if (!active) return <Tag color="red">已停用</Tag>;
        if (expired) return <Tag color="orange">已过期</Tag>;
        if (maxReached) return <Tag color="orange">已达上限</Tag>;
        return <Tag color="green">正常</Tag>;
      }
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (d) => dayjs(d).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="详情">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/links/${record.id}`)} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Tooltip title={record.is_active ? '停用' : '启用'}>
            <Button
              type="text"
              size="small"
              icon={record.is_active ? <StopOutlined style={{ color: '#faad14' }} /> : <CheckCircleOutlined style={{ color: '#52c41a' }} />}
              onClick={() => handleToggle(record)}
            />
          </Tooltip>
          <Popconfirm title="确定删除该短链？" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
            <Tooltip title="删除">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>短链管理</Title>
        <Space>
          <Input
            placeholder="搜索短码/URL/备注"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: 250 }}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建短链
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); }
          }}
        />
      </Card>

      <Modal
        title={editingLink ? '编辑短链' : '新建短链'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="longUrl"
            label="目标长链接"
            rules={[
              { required: true, message: '请输入目标URL' },
              { type: 'url', message: '请输入有效的URL地址' }
            ]}
          >
            <Input placeholder="https://example.com/your-long-url" />
          </Form.Item>

          <Form.Item
            name="shortCode"
            label="自定义短码（留空则自动生成）"
            rules={[
              { pattern: /^[a-zA-Z0-9_-]{3,20}$/, message: '只能包含字母、数字、下划线和连字符，长度3-20位' }
            ]}
          >
            <Input placeholder="留空自动生成，如 my-link" />
          </Form.Item>

          <Form.Item name="note" label="备注">
            <TextArea rows={2} placeholder="可选备注说明" />
          </Form.Item>

          <Form.Item name="expiresAt" label="过期时间（不选则永不过期）">
            <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm:ss" />
          </Form.Item>

          <Form.Item name="maxClicks" label="最大点击次数（不填或0为不限）">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="0 表示不限次数" />
          </Form.Item>

          {editingLink && (
            <Form.Item name="isActive" label="启用状态" valuePropName="checked">
              <Switch checkedChildren="启用" unCheckedChildren="停用" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}
