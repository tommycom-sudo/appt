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
  napi: string;
  idpi: string;
  mobilerg: string;
  jgmc: string;
  ksmc: string;
  da_sc: string;
  sd_sp_res_cd: string;
  sd_pipypm_cd: string;
  ysmc: string;
};

// 定义列配置
const columns: ProColumns<StopPatient>[] = [
  {
    title: '患者姓名',
    dataIndex: 'napi',
    valueType: 'text',
  },
  {
    title: '患者ID',
    dataIndex: 'idpi',
    valueType: 'text',
    copyable: true,
    ellipsis: true,
  },
  {
    title: '联系电话',
    dataIndex: 'mobilerg',
    valueType: 'text',
    copyable: true,
    ellipsis: true,
  },
  {
    title: '机构名称',
    dataIndex: 'jgmc',
    valueType: 'text',
  },
  {
    title: '科室名称',
    dataIndex: 'ksmc',
    valueType: 'text',
  },
  {
    title: '停诊日期',
    dataIndex: 'da_sc',
    valueType: 'date',
  },
  {
    title: '停诊原因',
    dataIndex: 'sd_sp_res_cd',
    valueType: 'text',
  },
  {
    title: '患者类型',
    dataIndex: 'sd_pipypm_cd',
    valueEnum: {
      '1': { text: '普通', status: 'Default' },
      '2': { text: '急诊', status: 'Error' },
      '3': { text: 'VIP', status: 'Success' },
      '4': { text: '其他', status: 'Warning' },
    },
  },
  {
    title: '医生姓名',
    dataIndex: 'ysmc',
    valueType: 'text',
  },
];

// 导出Excel函数
const exportToExcel = (data: any[], filename: string) => {
  try {
    const exportData = data.map(item => ({
      '患者姓名': item.napi,
      '患者ID': item.idpi,
      '联系电话': item.mobilerg,
      '机构名称': item.jgmc,
      '科室名称': item.ksmc,
      '停诊日期': item.da_sc,
      '停诊原因': item.sd_sp_res_cd,
      '患者类型': item.sd_pipypm_cd === '1' ? '普通' : 
                 item.sd_pipypm_cd === '2' ? '急诊' : 
                 item.sd_pipypm_cd === '3' ? 'VIP' : '其他',
      '医生姓名': item.ysmc
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
        
        return {
          data: data.data,
          success: data.success,
          total: data.total,
          pageSize: pageSize,
          current: current,
        };
      }}
      rowKey="idpi"
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