import { NextResponse } from 'next/server';
import patientData from './data.json';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('current') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');
  const keyword = searchParams.get('keyword') || '';
  // 记录搜索参数
  console.log('搜索参数:', {
    page,
    pageSize,
    keyword,
    rawParams: Object.fromEntries(searchParams)
  });
  // 模拟搜索功能
  let filteredData = patientData.data;
  const params = Object.fromEntries(searchParams);
  
  if (params.name) {
    filteredData = filteredData.filter(item => item.name.includes(params.name));
  }
  if (params.patientNo) {
    filteredData = filteredData.filter(item => item.patientNo.includes(params.patientNo));
  }
  if (params.phone) {
    filteredData = filteredData.filter(item => item.phone.includes(params.phone));
  }

  // 模拟分页
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedData = filteredData.slice(start, end);

  return NextResponse.json({
    data: paginatedData,
    success: true,
    total: filteredData.length,
  });
} 