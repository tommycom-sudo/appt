'use client';
//http://localhost:3000/api/patients/stop?stopDate=2025-04-03&pageSize=100&current=1
import { useEffect, useState } from 'react';
import { Button, message, DatePicker, Space, Modal } from 'antd';
import { ExportOutlined, DollarOutlined, HistoryOutlined } from '@ant-design/icons';
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
  idAppt: string;
};

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
const columns: ProColumns<StopPatient>[] = [
  {
    title: '患者姓名',
    dataIndex: 'name',
    valueType: 'text',
  },
  {
    title: '预约ID',
    dataIndex: 'idAppt',
    valueType: 'text',
    copyable: true,
    ellipsis: true,
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
    title: '支付方式',
    dataIndex: 'priorityLevel',
    valueEnum: {
      '1': { text: '现金', status: 'Default' },
      '2': { text: '储值金', status: 'Error' },
      '3': { text: '支付宝', status: 'Success' },
      '4': { text: '微信', status: 'Warning' },
    },
  },
  {
    title: '医生姓名',
    dataIndex: 'doctorName',
    valueType: 'text',
  },
  {
    title: '预约状态',
    dataIndex: 'refundStatus',
    valueType: 'text',
  },
  {
    title: '就诊ID',
    dataIndex: 'visitId',
    valueType: 'text',
    copyable: true,
    ellipsis: true,
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
      '支付方式': item.priorityLevel === '1' ? '普通' : 
                 item.priorityLevel === '2' ? '急诊' : 
                 item.priorityLevel === '3' ? 'VIP' : '其他',
      '医生姓名': item.doctorName,
      '就诊ID': item.visitId
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
      {wch: 10}, // 医生姓名
      {wch: 15}  // 就诊ID
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

// 退费函数
const handleRefund = async (selectedRows: StopPatient[]) => {
  try {
    if (!selectedRows || selectedRows.length === 0) {
      message.warning('请选择需要退费的患者');
      return;
    }

    const visitIds = selectedRows.map(row => row.visitId).filter(id => id);
    if (visitIds.length === 0) {
      message.warning('所选患者没有有效的就诊ID');
      return;
    }

    const response = await fetch('/api/refund', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(visitIds.map(id => ({ idVismed: id })))
    });

    if (response.ok) {
      const result = await response.json();
      if (result.error) {
        message.error(result.error);
      } else if (result.specialMessage) {
        // 显示特殊消息
        message.warning(result.specialMessage);
      } else {
        message.success('退费请求已发送');
      }
    } else {
      message.error('退费请求失败');
    }
  } catch (error) {
    console.error('退费错误:', error);
    message.error('退费操作失败');
  }
};

export default function StopPatientList() {
  const [mounted, setMounted] = useState(false);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [stopDate, setStopDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [isLogModalVisible, setIsLogModalVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>加载中...</div>;
  }

  return (
    <>
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
        rowKey="idAppt"
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
            key="refund"
            icon={<DollarOutlined />}
            disabled={!selectedRows?.length}
            onClick={() => handleRefund(selectedRows)}
          >
            退费
          </Button>,
          <Button
            key="refundLog"
            icon={<HistoryOutlined />}
            onClick={() => setIsLogModalVisible(true)}
          >
            退费日志
          </Button>,
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
      <Modal
        title="退费日志"
        open={isLogModalVisible}
        onCancel={() => setIsLogModalVisible(false)}
        width={1200}
        footer={null}
      >
        <ProTable<RefundLog>
          columns={[
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
          ]}
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
          toolBarRender={false}
        />
      </Modal>
    </>
  );
} 