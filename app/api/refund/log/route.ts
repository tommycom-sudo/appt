import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const current = parseInt(searchParams.get('current') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const offset = (current - 1) * pageSize;

    // 获取总记录数
    const countResult = await query(
      `SELECT COUNT(*) as total FROM REFUND_REQUEST_LOG`
    );
    const total = countResult.rows[0].TOTAL;

    // 获取分页数据
    const result = await query(
      `
    SELECT 
        log.id,
        hi_vis_med.id_vismed as "visitId",
        hi_vis_med.na_pi as "patientName",
        hi_vis_med.id_pi as "patientId",
        OPERATE_TIME as "refundTime",
        ERROR_MESSAGE as "refundStatus",
        ERROR_MESSAGE as "errorMessage",
        OPERATOR as "operator"
      FROM REFUND_REQUEST_LOG  log
        join hi_vis_med on hi_vis_med.id_vismed = log.id_vismed
      ORDER BY OPERATE_TIME DESC
      OFFSET :1 ROWS FETCH NEXT :2 ROWS ONLY`,
      [offset, pageSize]
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
      total: total,
      current: current,
      pageSize: pageSize
    });
  } catch (error) {
    console.error('获取退费日志失败:', error);
    return NextResponse.json(
      { success: false, error: '获取退费日志失败' },
      { status: 500 }
    );
  }
} 