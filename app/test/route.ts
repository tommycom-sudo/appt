import { NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/db';

export async function GET() {
  try {
    const users = await getAllUsers();
    return NextResponse.json({
      success: true,
      data: users,
      total: users.length
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '获取用户列表失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
} 