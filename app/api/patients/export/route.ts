// app/api/patients/export/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const sql = `
      SELECT 
        ID_USER as id,
        CD as patientNo,
        NA as name,
        MOBILE as phone,
        TO_CHAR(DT_CREATE, 'YYYY-MM-DD') as birthday,
        CASE TO_NUMBER(SD_IDTP) WHEN 1 THEN '男' WHEN 2 THEN '女' ELSE '未知' END as gender,
        CASE
          WHEN NVL(TRIM(FG_ACTIVE), '') = '1' THEN '正常'
          WHEN NVL(TRIM(FG_ACTIVE), '') = '0' THEN '已禁用'
          ELSE '待处理' 
        END as status 
      FROM BBP.HI_SYS_USER
      ORDER BY DT_CREATE DESC
    `;
    
    const result = await query(sql);
    
    const data = result.rows.map((row: any) => ({
      id: row.ID,
      patientNo: row.PATIENTNO,
      name: row.NAME,
      phone: row.PHONE,
      birthday: row.BIRTHDAY,
      gender: row.GENDER,
      status: row.STATUS
    }));
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('导出错误:', error);
    return NextResponse.json(
      { error: '导出失败' },
      { status: 500 }
    );
  }
}