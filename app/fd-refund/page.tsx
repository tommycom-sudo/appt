 'use client';

import { useState } from 'react';
import { Form, Input, Button, message, Card, Space, Typography } from 'antd';
import { DollarOutlined } from '@ant-design/icons';

const { Title } = Typography;

export default function FdRefundPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      console.log('提交的退款信息:', values);

      const response = await fetch('/api/refund/fd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operatorId: 'His001', // 这里可以根据实际情况修改
          orderNo: values.orderNo,
          refundAmount: values.refundAmount,
          refundReason: values.refundReason,
          idMedstoe: values.idMedstoe
        })
      });

      const result = await response.json();
      console.log('退款响应:', result);

      if (result.success) {
        message.success('退款请求已发送成功');
        form.resetFields();
      } else {
        message.error(
          `退款请求失败: ${result.error}${result.details ? ` (${result.details})` : ''}`
        );
      }
    } catch (error) {
      console.error('退款请求失败:', error);
      message.error(
        `退款请求失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Title level={2}>方鼎退款</Title>
          
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            style={{ maxWidth: 600 }}
          >
            <Form.Item
              label="订单号"
              name="orderNo"
              rules={[{ required: true, message: '请输入订单号' }]}
            >
              <Input placeholder="请输入订单号" />
            </Form.Item>

            <Form.Item
              label="退款金额"
              name="refundAmount"
              rules={[{ required: true, message: '请输入退款金额' }]}
            >
              <Input placeholder="请输入退款金额" />
            </Form.Item>

            <Form.Item
              label="退款原因"
              name="refundReason"
              rules={[{ required: true, message: '请输入退款原因' }]}
            >
              <Input.TextArea placeholder="请输入退款原因" rows={4} />
            </Form.Item>

            <Form.Item
              label="医疗订单ID"
              name="idMedstoe"
              rules={[{ required: true, message: '请输入医疗订单ID' }]}
            >
              <Input placeholder="请输入医疗订单ID" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<DollarOutlined />}
              >
                提交退款
              </Button>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
}