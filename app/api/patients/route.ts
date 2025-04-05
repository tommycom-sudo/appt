import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
// 输入验证和清理函数
function sanitizeInput(input: string): string {
  return input
    .replace(/%/g, '')  // 移除 %
    .replace(/_/g, '\\_')  // 转义 _
    .trim();  // 移除首尾空格
}
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const current = parseInt(searchParams.get('current') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const patientNo = searchParams.get('patientNo') || '';
    const name = searchParams.get('name') || '';
    const phone = searchParams.get('phone') || ''; 


    // 对所有输入参数进行处理
    const sanitizedPatientNo = sanitizeInput(patientNo);
    const sanitizedName = sanitizeInput(name);
    const sanitizedPhone = sanitizeInput(phone); 

    // 构建查询条件
    let whereClause = '';
    const params: string[] = [];
    
    if (sanitizedPatientNo || sanitizedName || sanitizedPhone) {
      whereClause = ` WHERE `;
      const conditions = [];
      
      if (sanitizedPatientNo) {
        conditions.push(`CD LIKE '%' || :${params.length + 1} || '%'`);
        params.push(sanitizedPatientNo);
      }
      
      if (sanitizedName) {
        conditions.push(`NA LIKE '%' || :${params.length + 1} || '%'`);
        params.push(sanitizedName);
      }
      
      if (sanitizedPhone) {
        conditions.push(`MOBILE LIKE '%' || :${params.length + 1} || '%'`);
        params.push(sanitizedPhone);
      }
      
      whereClause += conditions.join(' OR ');
    }
 

    // 计算总记录数
    const countSql = `SELECT COUNT(*) as total FROM BBP.HI_SYS_USER${whereClause}`;
    const countResult = await query(countSql, params);
    const total = (countResult.rows[0] as any).TOTAL;
    
    // 分页查询
    const offset = (current - 1) * pageSize;
    const sql = `
      SELECT * FROM (
        SELECT a.*, ROWNUM rnum FROM (
          SELECT 
            ID_USER as id,
            CD as patientNo,
            NA as name,
            MOBILE as phone,
            TO_CHAR(DT_CREATE, 'YYYY-MM-DD') as birthday,
            CASE TO_NUMBER(SD_IDTP) WHEN 1 THEN '男' WHEN 2 THEN '女' ELSE '未知' END as gender,
            CASE
              WHEN NVL(TRIM(FG_ACTIVE), '') = '1' THEN '1'
              WHEN NVL(TRIM(FG_ACTIVE), '') = '0' THEN '3'
              ELSE '2' 
            END as status 
          FROM BBP.HI_SYS_USER${whereClause}
          ORDER BY DT_CREATE DESC
        ) a WHERE ROWNUM <= :${params.length + 1}
      ) WHERE rnum > :${params.length + 2}
    `;
   
    console.log("params",[...params, offset + pageSize, offset]);
    const result = await query(sql, [...params, offset + pageSize, offset]);
    
    return NextResponse.json({
      data: result.rows.map((row: any) => ({
        id: row.ID,
        patientNo: row.PATIENTNO,
        name: row.NAME,
        phone: row.PHONE,
        birthday: row.BIRTHDAY,
        gender: row.GENDER,
        status: row.STATUS
      })),
      success: true,
      total,
      pageSize,
      current
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 