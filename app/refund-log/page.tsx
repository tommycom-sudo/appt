'use client';

import { useEffect, useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { Button, message } from 'antd';
import { ExportOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';

// 定义退费日志数据类型
type RefundLog = {
  id: number;
  visitId: string;
  patientName: string;
  patientId: string;
  refundTime: string;
  refundStatus: string;
  errorMessage: string;
  operator: string;
};

// 定义列配置
const columns: ProColumns<RefundLog>[] = [
  {
    title: '患者姓名',
    dataIndex: 'patientName',
    valueType: 'text',
  },
  {
    title: '患者ID',
    dataIndex: 'patientId',
    valueType: 'text',
    copyable: true,
    ellipsis: true,
  },
  {
    title: '就诊ID',
    dataIndex: 'visitId',
    valueType: 'text',
    copyable: true,
    ellipsis: true,
  },
  {
    title: '退费时间',
    dataIndex: 'refundTime',
    valueType: 'dateTime',
  },
  {
    title: '退费状态',
    dataIndex: 'refundStatus',
    valueType: 'text',
  },
  {
    title: '错误信息',
    dataIndex: 'errorMessage',
    valueType: 'text',
    ellipsis: true,
  },
  {
    title: '操作人',
    dataIndex: 'operator',
    valueType: 'text',
  },
];

// 导出Excel函数
const exportToExcel = (data: any[], filename: string) => {
  try {
    const exportData = data.map(item => ({
      '患者姓名': item.patientName,
      '患者ID': item.patientId,
      '就诊ID': item.visitId,
      '退费时间': item.refundTime,
      '退费状态': item.refundStatus,
      '错误信息': item.errorMessage,
      '操作人': item.operator
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    
    const wscols = [
      {wch: 10}, // 患者姓名
      {wch: 15}, // 患者ID
      {wch: 15}, // 就诊ID
      {wch: 20}, // 退费时间
      {wch: 10}, // 退费状态
      {wch: 30}, // 错误信息
      {wch: 10}  // 操作人
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "退费日志");
    XLSX.writeFile(wb, `${filename}_${new Date().toLocaleDateString()}.xlsx`);
    
    message.success('导出成功');
  } catch (error) {
    message.error('导出失败');
    console.error('导出错误:', error);
  }
};

export default function RefundLogList() {
  const [mounted, setMounted] = useState(false);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>加载中...</div>;
  }

  return (
    <ProTable<RefundLog>
      columns={columns}
      request={async (params) => {
        const { current, pageSize, ...rest } = params;
        const queryParams = new URLSearchParams({
          current: current?.toString() || '1',
          pageSize: pageSize?.toString() || '10',
          ...rest,
        });

        const res = await fetch(`/api/refund/log?${queryParams}`);
        const data = await res.json();
        
        return {
          data: data.data,
          success: data.success,
          total: data.total,
          pageSize: pageSize,
          current: current,
        };
      }}
      rowKey="id"
      pagination={{
        showSizeChanger: true,
        showQuickJumper: true,
        pageSizeOptions: ['10', '20', '50', '100'],
        defaultPageSize: 10
      }}
      search={{
        labelWidth: 'auto',
      }}
      dateFormatter="string"
      headerTitle="退费日志"
      toolBarRender={() => [
        <Button
          key="export"
          icon={<ExportOutlined />}
          disabled={!selectedRows?.length}
          onClick={() => exportToExcel(selectedRows, '退费日志')}
        >
          导出选择
        </Button>
      ]}
      rowSelection={{
        onChange: (_, selectedRows) => {
          setSelectedRows(selectedRows);
        }
      }}
    />
  );
} 