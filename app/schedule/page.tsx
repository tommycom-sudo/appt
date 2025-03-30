'use client'
import { useEffect, useState } from 'react';

interface DoctorSchedule {
  id: number;
  doctorId: string;
  doctorName: string;
  scheduleDate: string;
  period: string;
  initialSlots: number;
  followupSlots: number;
  totalSlots: number;
}

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<DoctorSchedule>) => void;
  schedule: DoctorSchedule | null;
}

function EditModal({ isOpen, onClose, onSave, schedule }: EditModalProps) {
  if (!isOpen || !schedule) return null;

  const [formData, setFormData] = useState({
    initialSlots: schedule.initialSlots,
    followupSlots: schedule.followupSlots,
    totalSlots: schedule.totalSlots
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-xl font-bold mb-4">编辑排班信息</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              医生：{schedule.doctorName}
            </label>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              日期：{schedule.scheduleDate}
            </label>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              时段：{schedule.period}
            </label>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              初诊号源数
            </label>
            <input
              type="number"
              value={formData.initialSlots}
              onChange={(e) => setFormData({ ...formData, initialSlots: parseInt(e.target.value) })}
              className="w-full p-2 border rounded"
              min="0"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              复诊号源数
            </label>
            <input
              type="number"
              value={formData.followupSlots}
              onChange={(e) => setFormData({ ...formData, followupSlots: parseInt(e.target.value) })}
              className="w-full p-2 border rounded"
              min="0"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              总号源数
            </label>
            <input
              type="number"
              value={formData.totalSlots}
              onChange={(e) => setFormData({ ...formData, totalSlots: parseInt(e.target.value) })}
              className="w-full p-2 border rounded"
              min="0"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const [doctorSchedules, setDoctorSchedules] = useState<DoctorSchedule[]>([]);
  const [editingSchedule, setEditingSchedule] = useState<DoctorSchedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/doctorSchedules.json')
      .then(res => res.json())
      .then(data => {
        setDoctorSchedules(data.doctorSchedules);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('加载数据失败:', error);
        setIsLoading(false);
      });
  }, []);

  // 获取一周的日期
  const getWeekDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  // 获取医生列表
  const getDoctors = () => {
    const doctors = new Set(doctorSchedules.map(schedule => schedule.doctorName));
    return Array.from(doctors);
  };

  // 检查是否是今天
  const isToday = (date: string) => {
    const today = new Date().toISOString().split('T')[0];
    return date === today;
  };

  // 处理双击编辑
  const handleDoubleClick = (doctor: string, period: string, date: string) => {
    console.log('双击事件触发:', { doctor, period, date }); // 添加日志
    const schedule = doctorSchedules.find(s => 
      s.doctorName === doctor && 
      s.scheduleDate === date && 
      s.period === period
    );
    console.log('找到的排班信息:', schedule); // 添加日志
    if (schedule) {
      setEditingSchedule(schedule);
    } else {
      // 如果没有找到排班信息，创建一个新的
      const newSchedule: DoctorSchedule = {
        id: Date.now(), // 使用时间戳作为临时ID
        doctorId: `D${doctorSchedules.length + 1}`,
        doctorName: doctor,
        scheduleDate: date,
        period: period,
        initialSlots: 0,
        followupSlots: 0,
        totalSlots: 0
      };
      setEditingSchedule(newSchedule);
    }
  };

  // 处理保存编辑
  const handleSaveEdit = (updatedData: Partial<DoctorSchedule>) => {
    if (!editingSchedule) return;
    
    setDoctorSchedules(prev => {
      const existingIndex = prev.findIndex(s => s.id === editingSchedule.id);
      if (existingIndex >= 0) {
        // 更新现有排班
        const newSchedules = [...prev];
        newSchedules[existingIndex] = { ...newSchedules[existingIndex], ...updatedData };
        return newSchedules;
      } else {
        // 添加新排班
        return [...prev, { ...editingSchedule, ...updatedData }];
      }
    });
  };

  const weekDates = getWeekDates();
  const doctors = getDoctors();
  const periods = ['上午', '下午'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-xl text-gray-600">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">医生排班表</h1>
        
        {/* 排班表格 */}
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          {/* 表头 */}
          <div className="grid grid-cols-8 border-b border-gray-200">
            <div className="p-4 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">医生/时间</div>
            {weekDates.map(date => (
              <div key={date} 
                   className={`p-4 text-center font-semibold border-r border-gray-200 last:border-r-0
                             ${isToday(date) ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-700'}`}>
                <div className="text-sm">{new Date(date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}</div>
                <div className={`text-xs ${isToday(date) ? 'text-blue-500' : 'text-gray-500'}`}>
                  {new Date(date).toLocaleDateString('zh-CN', { weekday: 'short' })}
                </div>
              </div>
            ))}
          </div>

          {/* 表格内容 */}
          {doctors.map(doctor => (
            <div key={doctor} className="border-b border-gray-200 last:border-b-0">
              {periods.map(period => (
                <div key={`${doctor}-${period}`} className="grid grid-cols-8">
                  <div className="p-4 bg-gray-50 border-r border-gray-200">
                    <div className="font-medium text-gray-900">{doctor}</div>
                    <div className="text-sm text-gray-500">{period}</div>
                  </div>
                  {weekDates.map(date => (
                    <div key={`${doctor}-${period}-${date}`} 
                         className={`p-4 border-r border-gray-200 last:border-r-0 transition-colors
                                   ${isToday(date) ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'} 
                                   cursor-pointer`}
                         onDoubleClick={() => handleDoubleClick(doctor, period, date)}>
                      <div className={`text-sm ${isToday(date) ? 'text-blue-900' : 'text-gray-900'}`}>
                        {doctorSchedules.find(s => 
                          s.doctorName === doctor && 
                          s.scheduleDate === date && 
                          s.period === period
                        )?.totalSlots || 0} 号
                      </div>
                      <div className={`text-xs ${isToday(date) ? 'text-blue-500' : 'text-gray-500'}`}>
                        初诊: {doctorSchedules.find(s => 
                          s.doctorName === doctor && 
                          s.scheduleDate === date && 
                          s.period === period
                        )?.initialSlots || 0}
                      </div>
                      <div className={`text-xs ${isToday(date) ? 'text-blue-500' : 'text-gray-500'}`}>
                        复诊: {doctorSchedules.find(s => 
                          s.doctorName === doctor && 
                          s.scheduleDate === date && 
                          s.period === period
                        )?.followupSlots || 0}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* 图例说明 */}
        <div className="mt-6 flex items-center justify-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-100 rounded-full mr-2"></div>
            <span>可预约</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-100 rounded-full mr-2"></div>
            <span>已约满</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-100 rounded-full mr-2"></div>
            <span>未排班</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-100 rounded-full mr-2"></div>
            <span>今天</span>
          </div>
        </div>
      </div>

      {/* 编辑弹窗 */}
      <EditModal
        isOpen={!!editingSchedule}
        onClose={() => setEditingSchedule(null)}
        onSave={handleSaveEdit}
        schedule={editingSchedule}
      />
    </div>
  );
} 