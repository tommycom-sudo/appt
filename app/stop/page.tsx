'use client';
//http://localhost:3000/api/patients/stop?stopDate=2025-04-03&pageSize=100&current=1
import { useEffect, useState } from 'react';
import { Button, message, DatePicker, Space } from 'antd';
import { ExportOutlined } from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

// 定义数据类型
type StopPatient = {
  idPi: string;
  name: string;
  phone: string;
  hospitalName: string;
  departmentName: string;
  appointmentDate: string;
  appointmentType: string;
  priorityLevel: string;
  doctorName: string;
  refundStatus: string;
  visitTime: string;
  visitId: string;
};

// 定义列配置
const columns: ProColumns<StopPatient>[] = [
  {
    title: '患者姓名',
    dataIndex: 'name',
    valueType: 'text',
  },
  {
    title: '患者ID',
    dataIndex: 'idPi',
    valueType: 'text',
    copyable: true,
    ellipsis: true,
  },
  {
    title: '联系电话',
    dataIndex: 'phone',
    valueType: 'text',
    copyable: true,
    ellipsis: true,
  },
  {
    title: '机构名称',
    dataIndex: 'hospitalName',
    valueType: 'text',
  },
  {
    title: '科室名称',
    dataIndex: 'departmentName',
    valueType: 'text',
  },
  {
    title: '停诊日期',
    dataIndex: 'appointmentDate',
    valueType: 'date',
  },
  {
    title: '停诊原因',
    dataIndex: 'appointmentType',
    valueType: 'text',
  },
  {
    title: '就诊时间',
    dataIndex: 'visitTime',
    valueType: 'dateTime',
    render: (dom: any, entity: StopPatient) => {
      if (!entity.visitTime) return '-';
      const date = new Date(entity.visitTime);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
  },
  {
    title: '患者类型',
    dataIndex: 'priorityLevel',
    valueEnum: {
      '1': { text: '普通', status: 'Default' },
      '2': { text: '急诊', status: 'Error' },
      '3': { text: 'VIP', status: 'Success' },
      '4': { text: '其他', status: 'Warning' },
    },
  },
  {
    title: '医生姓名',
    dataIndex: 'doctorName',
    valueType: 'text',
  },
];

// 导出Excel函数
const exportToExcel = (data: any[], filename: string) => {
  try {
    const exportData = data.map(item => ({
      '患者姓名': item.name,
      '患者ID': item.idPi,
      '联系电话': item.phone,
      '机构名称': item.hospitalName,
      '科室名称': item.departmentName,
      '停诊日期': item.appointmentDate,
      '停诊原因': item.appointmentType,
      '患者类型': item.priorityLevel === '1' ? '普通' : 
                 item.priorityLevel === '2' ? '急诊' : 
                 item.priorityLevel === '3' ? 'VIP' : '其他',
      '医生姓名': item.doctorName
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    
    const wscols = [
      {wch: 10}, // 患者姓名
      {wch: 15}, // 患者ID
      {wch: 15}, // 联系电话
      {wch: 20}, // 机构名称
      {wch: 25}, // 科室名称
      {wch: 12}, // 停诊日期
      {wch: 15}, // 停诊原因
      {wch: 10}, // 患者类型
      {wch: 10}  // 医生姓名
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "停诊患者列表");
    XLSX.writeFile(wb, `${filename}_${new Date().toLocaleDateString()}.xlsx`);
    
    message.success('导出成功');
  } catch (error) {
    message.error('导出失败');
    console.error('导出错误:', error);
  }
};

export default function StopPatientList() {
  const [mounted, setMounted] = useState(false);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [stopDate, setStopDate] = useState<string>(dayjs().format('YYYY-MM-DD'));

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>加载中...</div>;
  }

  return (
    <ProTable<StopPatient>
      columns={columns}
      request={async (params) => {
        // 构建查询参数
        const { current, pageSize, ...rest } = params;
        const queryParams = new URLSearchParams({
          current: current?.toString() || '1',
          pageSize: pageSize?.toString() || '10',
          stopDate: stopDate,
          ...rest,
        });

        // 发送请求
        const res = await fetch(`/api/patients/stop?${queryParams}`);
        const data = await res.json();
        console.log("data===============",data);
        return {
          data: data.data,
          success: data.success,
          total: data.total,
          pageSize: pageSize,
          current: current,
        };
      }}
      rowKey="visitId"
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
      headerTitle="停诊关联患者清单"
      toolBarRender={() => [
        <Space key="datePicker">
          <span>停诊日期：</span>
          <DatePicker 
            value={dayjs(stopDate)} 
            onChange={(date) => {
              if (date) {
                setStopDate(date.format('YYYY-MM-DD'));
              }
            }}
          />
        </Space>,
        <Button
          key="exportAll"
          icon={<ExportOutlined />}
          onClick={async () => {
            const res = await fetch(`/api/patients/stop?stopDate=${stopDate}`);
            const data = await res.json();
            exportToExcel(data.data, '停诊患者列表');
          }}
        >
          导出 Excel
        </Button>,
        <Button
          key="export"
          disabled={!selectedRows?.length}
          onClick={() => exportToExcel(selectedRows, '停诊患者列表')}
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