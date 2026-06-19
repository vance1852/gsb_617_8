import { useState, useEffect } from 'react'
import { Table, Button, Input, Space, Tag, Modal, Form, DatePicker, InputNumber, message, Popconfirm, Typography, Tooltip } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, PoweroffOutlined, CopyOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { linksApi } from '../services/api'

const { Title } = Typography
const { Search } = Input

const truncate = (str, len = 50) => str?.length > len ? str.slice(0, len) + '...' : str

export default function Links() {
  const [form] = Form.useForm()
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  const fetchLinks = async (page = 1, pageSize = 10, search = '') => {
    setLoading(true)
    try {
      const res = await linksApi.list({ page, pageSize, search })
      setLinks(res.links || [])
      setPagination({ current: page, pageSize, total: res.total || 0 })
    } catch (e) {
      message.error('加载短链列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLinks(1, pagination.pageSize, searchText) }, [])

  const handleCopy = (code) => {
    const shortUrl = `${window.location.origin}/${code}`
    navigator.clipboard.writeText(shortUrl)
    message.success('短链接已复制: ' + shortUrl)
  }

  const handleToggle = async (record) => {
    try {
      const updated = await linksApi.toggle(record.id)
      setLinks(links.map(l => l.id === record.id ? updated : l))
      message.success(record.is_active ? '已停用' : '已启用')
    } catch (e) {
      message.error('操作失败')
    }
  }

  const handleDelete = async (id) => {
    try {
      await linksApi.delete(id)
      message.success('删除成功')
      fetchLinks(pagination.current, pagination.pageSize, searchText)
    } catch (e) {
      message.error('删除失败')
    }
  }

  const openCreateModal = () => {
    setEditingId(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEditModal = (record) => {
    setEditingId(record.id)
    form.setFieldsValue({
      short_code: record.short_code,
      long_url: record.long_url,
      remark: record.remark,
      expires_at: record.expires_at ? dayjs(record.expires_at) : null,
      max_clicks: record.max_clicks
    })
    setModalOpen(true)
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      const data = {
        short_code: values.short_code?.trim() || undefined,
        long_url: values.long_url,
        remark: values.remark,
        expires_at: values.expires_at ? values.expires_at.toISOString() : null,
        max_clicks: values.max_clicks || null
      }
      if (editingId) {
        await linksApi.update(editingId, data)
        message.success('更新成功')
      } else {
        await linksApi.create(data)
        message.success('创建成功')
      }
      setModalOpen(false)
      fetchLinks(pagination.current, pagination.pageSize, searchText)
    } catch (e) {
      if (e.errorFields) return
      message.error(e.response?.data?.error || '操作失败')
    }
  }

  const handleTableChange = (pag) => {
    fetchLinks(pag.current, pag.pageSize, searchText)
  }

  const handleSearch = (value) => {
    setSearchText(value)
    fetchLinks(1, pagination.pageSize, value)
  }

  const columns = [
    {
      title: '短码',
      dataIndex: 'short_code',
      key: 'short_code',
      width: 140,
      render: (code) => (
        <Space>
          <Typography.Text strong>{code}</Typography.Text>
          <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => handleCopy(code)} />
        </Space>
      )
    },
    {
      title: '长链接',
      dataIndex: 'long_url',
      key: 'long_url',
      ellipsis: true,
      render: (url) => (
        <Tooltip title={url}>
          <a href={url} target="_blank" rel="noreferrer">{truncate(url)}</a>
        </Tooltip>
      )
    },
    { title: '备注', dataIndex: 'remark', key: 'remark', width: 120, ellipsis: true },
    {
      title: '点击/上限',
      key: 'clicks',
      width: 100,
      render: (_, r) => `${r.click_count} / ${r.max_clicks || '∞'}`
    },
    {
      title: '过期时间',
      dataIndex: 'expires_at',
      key: 'expires_at',
      width: 120,
      render: (t) => t ? dayjs(t).format('YYYY-MM-DD') : '永不过期'
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (active) => <Tag color={active ? 'success' : 'default'}>{active ? '启用' : '停用'}</Tag>
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)}>编辑</Button>
          <Button type="link" size="small" icon={<PoweroffOutlined />} onClick={() => handleToggle(record)}>
            {record.is_active ? '停用' : '启用'}
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>短链管理</Title>
        <Space>
          <Search
            placeholder="搜索短码/长链接/备注"
            allowClear
            enterButton={<SearchOutlined />}
            onSearch={handleSearch}
            style={{ width: 300 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>创建短链</Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={links}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
          pageSizeOptions: ['10', '20', '50']
        }}
        onChange={handleTableChange}
        scroll={{ x: 1100 }}
      />

      <Modal
        title={editingId ? '编辑短链' : '创建短链'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        width={520}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="short_code" label="短码（不填自动生成）">
            <Input placeholder="留空系统自动生成" maxLength={32} />
          </Form.Item>
          <Form.Item
            name="long_url"
            label="目标长链接 URL"
            rules={[
              { required: true, message: '请输入长链接' },
              { type: 'url', message: '请输入有效的URL（需包含http://或https://）' }
            ]}
          >
            <Input placeholder="https://example.com/your/long/url" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input placeholder="可选备注说明" />
          </Form.Item>
          <Form.Item name="expires_at" label="过期时间">
            <DatePicker style={{ width: '100%' }} placeholder="留空永不过期" showTime={false} />
          </Form.Item>
          <Form.Item name="max_clicks" label="最大点击次数">
            <InputNumber min={1} placeholder="留空表示不限次数" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
