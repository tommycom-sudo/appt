import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import oracledb from 'oracledb';
import { Console } from 'console';


interface UserRow {
  id: string;
  patientNo: string;
  name: string;
  phone: string;
  birthday: string;
  gender: string;
  status: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const current = parseInt(searchParams.get('current') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const keyword = searchParams.get('keyword') || '';

    // 构建查询条件
    let whereClause = '';
    const params: any[] = [];
    
    if (keyword) {
      whereClause = ` WHERE NA LIKE '%' || :1 || '%' OR CD LIKE '%' || :1 || '%' OR MOBILE LIKE '%' || :1 || '%'`;
      params.push(keyword);
      console.log(whereClause);
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
           CASE  TO_NUMBER(SD_IDTP)   WHEN  1  THEN '男' WHEN  2  THEN '女' ELSE '未知' END as gender,
            case
                WHEN NVL(TRIM(FG_ACTIVE), '') = '1' THEN '1'
                WHEN NVL(TRIM(FG_ACTIVE), '') = '0' THEN '3'
                ELSE '2' END as status 
          FROM BBP.HI_SYS_USER${whereClause}
          ORDER BY DT_CREATE DESC
        ) a WHERE ROWNUM <= :${params.length + 1}
      ) WHERE rnum > :${params.length + 2}
    `;
   
    console.log("params",[...params, offset + pageSize, offset]);
    const result = await query(sql, [...params, offset + pageSize, offset]);
    
    // 转换数据格式
    
    const data = result.rows.map((row: any) => ({
      id: row.ID,
      patientNo: row.PATIENTNO,  // 使用列名
      name: row.NAME,          // 使用列名
      phone: row.PHONE,        // 使用列名
      birthday: row.BIRTHDAY,  // 使用列名
      gender: row.GENDER,      // 使用列名
      status: row.STATUS       // 使用列名
    }));
  
    return NextResponse.json({
      data,
      success: true,
      total
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 