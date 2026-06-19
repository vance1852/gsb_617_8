import React, { useEffect, useState } from 'react';
import {
  Table, Button, Space, Input, Tag, Modal, Form,
  DatePicker, InputNumber, Switch, message, Popconfirm, Tooltip
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined,
  DeleteOutlined, PoweroffOutlined, EyeOutlined, CopyOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const { TextArea } = Input;

function ShortUrls() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    fetchList();
  }, [page, keyword]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await api.get('/shorturls', { params: { page, pageSize, keyword } });
      setData(res.list);
      setTotal(res.total);
    } catch (error) {
      message.error('获取列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingItem(record);
    form.setFieldsValue({
      ...record,
      expiresAt: record.expiresAt ? dayjs(record.expiresAt) : null
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const submitData = {
        ...values,
        expiresAt: values.expiresAt ? values.expiresAt.toISOString() : null
      };

      if (editingItem) {
        await api.put(`/shorturls/${editingItem.id}`, submitData);
        message.success('更新成功');
      } else {
        await api.post('/shorturls', submitData);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchList();
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/shorturls/${id}`);
      message.success('删除成功');
      fetchList();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleToggle = async (record) => {
    try {
      await api.post(`/shorturls/${record.id}/toggle`);
      message.success(record.isActive ? '已停用' : '已启用');
      fetchList();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleCopy = (code) => {
    const shortUrl = `${window.location.origin}/s/${code}`;
    navigator.clipboard.writeText(shortUrl);
    message.success('短链接已复制');
  };

  const columns = [
    {
      title: '短码',
      dataIndex: 'shortCode',
      key: 'shortCode',
      width: 120,
      render: (text) => (
        <Space>
          <Tag color="blue" style={{ cursor: 'pointer' }} onClick={() => handleCopy(text)}>
            <CopyOutlined /> {text}
          </Tag>
        </Space>
      )
    },
    {
      title: '目标链接',
      dataIndex: 'longUrl',
      key: 'longUrl',
      ellipsis: true,
      render: (url) => (
        <a href={url} target="_blank" rel="noopener noreferrer">
          {url}
        </a>
      )
    },
    {
      title: '点击数',
      dataIndex: 'clickCount',
      key: 'clickCount',
      width: 100,
      sorter: true,
      render: (count, record) => (
        <span style={{
          fontWeight: 'bold',
          color: record.maxClicks && count >= record.maxClicks ? '#ff4d4f' : '#1890ff'
        }}>
          {count}{record.maxClicks ? ` / ${record.maxClicks}` : ''}
        </span>
      )
    },
    {
      title: '过期时间',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      width: 170,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : <span style={{ color: '#999' }}>永久有效</span>
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 90,
      render: (active, record) => {
        let color = active ? 'green' : 'default';
        let text = active ? '启用' : '停用';
        if (record.expiresAt && dayjs().isAfter(record.expiresAt)) {
          color = 'orange';
          text = '已过期';
        } else if (record.maxClicks && record.clickCount >= record.maxClicks) {
          color = 'red';
          text = '已用尽';
        }
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 120,
      ellipsis: true,
      render: (text) => text || <span style={{ color: '#ccc' }}>-</span>
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看统计">
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/stats/${record.id}`)} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Tooltip title={record.isActive ? '停用' : '启用'}>
            <Button
              type="link"
              size="small"
              icon={<PoweroffOutlined />}
              onClick={() => handleToggle(record)}
              danger={record.isActive}
            />
          </Tooltip>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Input
            placeholder="搜索短码、链接或备注"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            style={{ width: 300 }}
            allowClear
          />
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建短链
        </Button>
      </div>

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
          onChange: setPage,
          showSizeChanger: false,
          showTotal: (t) => `共 ${t} 条`
        }}
      />

      <Modal
        title={editingItem ? '编辑短链' : '新建短链'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="shortCode"
            label="短码（留空自动生成）"
            rules={[{ max: 20, message: '最长20个字符' }]}
          >
            <Input placeholder="自定义短码，留空系统自动生成6位短码" />
          </Form.Item>
          <Form.Item
            name="longUrl"
            label="目标长链接"
            rules={[
              { required: true, message: '请输入目标链接' },
              { type: 'url', message: '请输入有效的URL' }
            ]}
          >
            <TextArea rows={2} placeholder="请输入完整的URL，例如 https://example.com/long/url" />
          </Form.Item>
          <Form.Item name="expiresAt" label="过期时间（可选）">
            <DatePicker showTime style={{ width: '100%' }} placeholder="设置过期时间，不填则永久有效" />
          </Form.Item>
          <Form.Item name="maxClicks" label="最大点击次数（可选）">
            <InputNumber min={1} style={{ width: '100%' }} placeholder="设置点击次数上限，不填则不限次数" />
          </Form.Item>
          <Form.Item name="remark" label="备注（可选）">
            <Input.TextArea rows={2} placeholder="添加备注信息" />
          </Form.Item>
          {editingItem && (
            <Form.Item name="isActive" label="启用状态" valuePropName="checked">
              <Switch checkedChildren="启用" unCheckedChildren="停用" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}

export default ShortUrls;
