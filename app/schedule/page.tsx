'use client'
import React, { useEffect, useState } from 'react';

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

interface TimeSlot {
  id: number;
  startTime: string;
  endTime: string;
  totalSlots: number;
  usedSlots: number;
}

interface Channel {
  id: number;
  name: string;
  percentage: number;
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

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [timeSlotDistribution, setTimeSlotDistribution] = useState<{ [key: string]: number }>({});
  const [channelDistribution, setChannelDistribution] = useState<{ [key: string]: number }>({});
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
  const [showInitialSlotsAnimation, setShowInitialSlotsAnimation] = useState(false);

  useEffect(() => {
    // 加载时间段数据
    fetch('/timeSlots.json')
      .then(res => res.json())
      .then(data => setTimeSlots(data.timeSlots));

    // 加载渠道数据
    fetch('/channels.json')
      .then(res => res.json())
      .then(data => setChannels(data.channels));
  }, []);

  // 计算渠道分配
  const calculateChannelDistribution = (totalSlots: number) => {
    const distribution: { [key: string]: number } = {};
    channels.forEach(channel => {
      distribution[channel.id] = Math.round(totalSlots * (channel.percentage / 100));
    });
    
    // 处理舍入误差
    const total = Object.values(distribution).reduce((a, b) => a + b, 0);
    if (total !== totalSlots) {
      const diff = totalSlots - total;
      distribution[channels[0].id] += diff; // 将误差加到第一个渠道
    }
    
    setChannelDistribution(distribution);
  };

  // 处理时间段分配变化
  const handleTimeSlotChange = (slotId: number, value: number) => {
    const newDistribution = { ...timeSlotDistribution, [slotId]: value };
    setTimeSlotDistribution(newDistribution);
    
    // 计算总号源数
    const total = (Object.values(newDistribution) as number[]).reduce((a, b) => a + b, 0);
    
    // 更新总号源数和初诊号源数
    setFormData(prev => ({
      ...prev,
      totalSlots: total,
      initialSlots: total // 将总号源数设置为初诊号源数
    }));

    // 显示动画效果
    setShowInitialSlotsAnimation(true);
    setTimeout(() => setShowInitialSlotsAnimation(false), 1000);
    
    // 更新渠道分配
    calculateChannelDistribution(total);
  };

  // 处理号源数变化
  const handleSlotsChange = (type: 'initialSlots' | 'followupSlots' | 'totalSlots', value: number) => {
    const newFormData = { ...formData, [type]: value };
    setFormData(newFormData);
    
    // 计算总号源数
    const total = type === 'totalSlots' ? value : 
                 newFormData.initialSlots + newFormData.followupSlots;
    
    // 更新总号源数
    if (type !== 'totalSlots') {
      newFormData.totalSlots = total;
      setFormData(newFormData);
    }
    
    // 计算分配
    const slotsPerTime = Math.floor(total / timeSlots.length);
    const remainingSlots = total % timeSlots.length;
    
    const distribution: { [key: string]: number } = {};
    timeSlots.forEach((slot, index) => {
      distribution[slot.id] = slotsPerTime + (index < remainingSlots ? 1 : 0);
    });
    
    setTimeSlotDistribution(distribution);
    calculateChannelDistribution(total);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[800px] h-[600px] flex flex-col">
        <h2 className="text-xl font-bold mb-4">编辑排班信息</h2>
        
        {/* TAB导航 */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('basic')}
              className={`${
                activeTab === 'basic'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              基本信息
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`${
                activeTab === 'advanced'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              高级设置
            </button>
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto pr-4">
            {activeTab === 'basic' ? (
              <div className="grid grid-cols-2 gap-6">
                {/* 左侧：基本信息 */}
                <div>
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
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.initialSlots}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSlotsChange('initialSlots', parseInt(e.target.value))}
                        className={`w-full p-2 border rounded transition-all duration-300 ${
                          showInitialSlotsAnimation ? 'text-xl font-bold text-blue-600' : ''
                        }`}
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      复诊号源数
                    </label>
                    <input
                      type="number"
                      value={formData.followupSlots}
                      onChange={(e) => handleSlotsChange('followupSlots', parseInt(e.target.value))}
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
                      onChange={(e) => handleSlotsChange('totalSlots', parseInt(e.target.value))}
                      className="w-full p-2 border rounded"
                      min="0"
                    />
                  </div>
                </div>

                {/* 右侧：时间段和渠道信息 */}
                <div>
                  {/* 时间段信息 */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">时间段分配</h3>
                    <div className="space-y-2">
                      {timeSlots.map(slot => (
                        <div key={slot.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm">{slot.startTime} - {slot.endTime}</span>
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              value={timeSlotDistribution[slot.id] || 0}
                              onChange={(e) => handleTimeSlotChange(slot.id, parseInt(e.target.value) || 0)}
                              className={`w-20 p-1 border rounded text-sm ${
                                (timeSlotDistribution[slot.id] || 0) === 0 ? 'border-red-500 text-red-500' : ''
                              }`}
                              min="0"
                            />
                            <span className={`text-sm ${(timeSlotDistribution[slot.id] || 0) === 0 ? 'text-red-500' : 'text-gray-600'}`}>
                              号
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 渠道信息 */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">渠道分配</h3>
                    <div className="space-y-2">
                      {channels.map(channel => (
                        <div key={channel.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm">{channel.name}</span>
                          <span className="text-sm text-gray-600">
                            分配号源: {channelDistribution[channel.id] || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">高级设置</h3>
                  <p className="text-gray-600">这里可以添加更多高级设置选项...</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
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