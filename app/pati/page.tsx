'use client';

import { useEffect, useState } from 'react';
import { Button, message, Progress,Modal } from 'antd';
import { PlusOutlined, ExportOutlined } from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import * as XLSX from 'xlsx';

// 定义数据类型
type Patient = {
  id: number;
  patientNo: string;
  name: string;
  phone: string;
  birthday: string;
  gender: string;
  status: number;
};

// 定义列配置
const columns: ProColumns<Patient>[] = [
  {
    title: '患者编号',
    dataIndex: 'patientNo',
    copyable: true,
    ellipsis: true,
  },
  {
    title: '姓名',
    dataIndex: 'name',
    valueType: 'text',
  },
  {
    title: '手机号',
    dataIndex: 'phone',
    valueType: 'text',
    copyable: true,
    ellipsis: true,
  },
  {
    title: '生日',
    dataIndex: 'birthday',
    valueType: 'date',
  },
  {
    title: '性别',
    dataIndex: 'gender',
    valueEnum: {
      男: { text: '男' },
      女: { text: '女' },
    },
  },
  {
    title: '状态',
    dataIndex: 'status',
    valueEnum: {
      1: { text: '正常', status: 'Success' },
      2: { text: '待处理', status: 'Warning' },
      3: { text: '已禁用', status: 'Error' },
    },
  },
  {
    title: '操作',
    valueType: 'option',
    key: 'option',
    render: (_, record) => [
      <a key="edit" onClick={() => handleEdit(record)}>
        编辑
      </a>,
      <a key="delete" onClick={() => handleDelete(record)}>
        删除
      </a>,
    ],
  },
];

// 处理编辑
const handleEdit = (record: Patient) => {
  message.info(`编辑患者：${record.name}`);
};

// 处理删除
const handleDelete = (record: Patient) => {
  message.info(`删除患者：${record.name}`);
};

const exportToExcel = (data: any[], filename: string) => {
  try {
    const exportData = data.map(item => ({
      '患者编号': item.patientNo,
      '姓名': item.name,
      '手机号': item.phone,
      '生日': item.birthday,
      '性别': item.gender,
      '状态': item.status === '1' ? '正常' : item.status === '3' ? '已禁用' : '待处理'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    
    const wscols = [
      {wch: 15},
      {wch: 10},
      {wch: 15},
      {wch: 12},
      {wch: 8},
      {wch: 10}
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "患者列表");
    XLSX.writeFile(wb, `${filename}_${new Date().toLocaleDateString()}.xlsx`);
    
    message.success('导出成功');
  } catch (error) {
    message.error('导出失败');
    console.error('导出错误:', error);
  }
};

export default function PatientList() {
  const [mounted, setMounted] = useState(false);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>加载中...</div>;
  }

  return (
    <ProTable<Patient>
      columns={columns}
      request={async (params) => {
        // 构建查询参数
        const { current, pageSize,...rest } = params;
        const queryParams = new URLSearchParams({
          current: current?.toString() || '1',
          pageSize: pageSize?.toString() || '10',
          ...rest,
        });

        // 发送请求
        const res = await fetch(`/api/patients?${queryParams}`);
        console.log("res===============",res);
        //const res = await fetch(`/test?${queryParams}`);
        const data = await res.json();
        /*
        console.log("数据:", data);
        console.log("类型:", typeof data);
        console.log("属性:", Object.keys(data));
        console.log("data===============",data.total);
        */
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
      headerTitle="患者列表"
      toolBarRender={() => [
        <Button
          key="button"
          icon={<PlusOutlined />}
          type="primary"
          onClick={() => {
            message.info('点击了新建');
          }}
        >
          新建
        </Button>,
        <Button
          key="exportAll"
          icon={<ExportOutlined />}
          onClick={async () => {
            const res = await fetch('/api/patients/export');
            const data = await res.json();
            
            console.log('点击导出按钮，选中行数:', data.length);  // 调试日志
            //exportWithProgress(data, '患者列表');
            exportToExcel(data, '患者列表');
          }}
        >
          导出 Excel
        </Button>,
        
        <Button
         key="export"
         disabled={!selectedRows?.length}
         onClick={() => exportToExcel(selectedRows, '患者列表')}
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