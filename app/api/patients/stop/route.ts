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
    const stopDate = searchParams.get('stopDate');
    const current = parseInt(searchParams.get('current') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    if (!stopDate) {
      return NextResponse.json(
        { error: '缺少停诊日期参数' },
        { status: 400 }
      );
    }

    console.log('查询参数 stopDate:', stopDate);
    console.log('分页参数 current:', current, 'pageSize:', pageSize);

    // 计算总记录数
    const countSql = `
      SELECT COUNT(*) as total
      FROM HI_SC_DA t1
      LEFT JOIN hi_appt t4 ON t4.id_scda = t1.id_scda
      WHERE t1.SD_SC_STA_cd = '2'
        AND t4.SD_APPTSTATUS_CD IN ('4', '5')
        AND t1.id_scda IN (
          SELECT t1.id_scda
          FROM (
            SELECT 
              t.ID_SCDA AS id_scda,
              t.ID_SCRES AS id_scres,
              t.SD_STP_CD AS sd_stp_cd,
              t.dt_stp,
              t.da_sc
            FROM HI_SC_DA t
            WHERE t.SD_SC_STA_cd = '2'
            ORDER BY t.dt_stp DESC
          ) t1
          WHERE TRUNC(t1.DA_SC) = TRUNC(TO_DATE(:1, 'YYYY-MM-DD'))
        )
    `;
    
    const countResult = await query(countSql, [stopDate]);
    const total = (countResult.rows[0] as any).TOTAL;
    console.log('总记录数:', total);

    // 分页查询
    const offset = (current - 1) * pageSize;
    const sql = `
      SELECT * FROM (
        SELECT a.*, ROWNUM rnum FROM (
          SELECT 
            t5.na_pi as napi,
            t5.id_pi as idpi,
            NVL(t7.phone_picont, t5.mobilerg) as mobilerg,
            t2.na as jgmc,
            DECODE(t3.na, 'H-口腔预防科(牙体牙髓病科三室)', 'H-口腔预防科', t3.na) || '(' || t6.na || ')' as ksmc,
            TO_CHAR(t1.da_sc, 'yyyy-MM-dd') as da_sc,
            map_dic_item_na(t1.sd_sp_res_cd, 'hi.his.spRes') as sd_sp_res_cd,
            NVL(pipypm.SD_PIPYPM_CD, '未知') as sd_pipypm_cd,
            t6.cd || '-' || t6.na as ysmc,
            DECODE(T4.SD_APPTSTATUS_CD , '4', '4-已退款', '5','5-已付费', T4.SD_APPTSTATUS_CD) AS SD_APPTSTATUS_CD,
            t4.dt_b_est AS jzsj,
            stoe.id_vismed,
            t7.id_appt
          FROM HI_SC_DA t1
          LEFT JOIN bbp.hi_sys_org t2 ON t2.id_org = t1.id_org
          LEFT JOIN bbp.hi_sys_dep t3 ON t3.id_dep = t1.ID_DEP_RES
          LEFT JOIN hi_appt t4 ON t4.id_scda = t1.id_scda
          LEFT JOIN hi_pi t5 ON t5.id_pi = t4.id_pi
          LEFT JOIN bbp.hi_sys_user t6 ON t6.id_user = t1.ID_ENTITY_RES
          LEFT JOIN hi_appt_op t7 ON t7.id_appt = t4.id_appt
          LEFT JOIN Hi_bil_Med_st_oe stoe ON stoe.id_vismed = t4.id_vismed AND stoe.SD_MEDST_CD = '112'
          LEFT JOIN HI_BIL_MED_PIPY_OE pipyoe ON t4.ID_VISMED = pipyoe.ID_VISMED AND pipyoe.eu_direct = '1' AND stoe.ID_MEDSTOE = pipyoe.ID_MEDSTOE
          LEFT JOIN HI_BIL_MED_PIPY_OE_PM pipypm ON pipyoe.id_medpipyoe = pipypm.id_medpipyoe
          WHERE t1.SD_SC_STA_cd = '2'
            AND t4.SD_APPTSTATUS_CD IN ('4', '5')
            AND TRUNC(t1.da_sc) = TRUNC(TO_DATE(:1, 'YYYY-MM-DD'))
          ORDER BY t1.da_sc DESC
        ) a WHERE ROWNUM <= :2
      ) WHERE rnum > :3
    `;

    console.log('执行SQL查询:', sql);
    console.log('查询参数:', [stopDate, offset + pageSize, offset]);

    const result = await query(sql, [stopDate, offset + pageSize, offset]);
    
    console.log('查询结果:', {
      rowCount: result.rows?.length || 0,
      metaData: result.metaData
    });

    return NextResponse.json({
      success: true,
      data: result.rows.map((row: any) => ({
        idPi: row.IDPI,
        name: row.NAPI,
        phone: row.MOBILERG,
        hospitalName: row.JGMC,
        departmentName: row.KSMC,
        appointmentDate: row.DA_SC,
        appointmentType: row.SD_SP_RES_CD,
        priorityLevel: row.SD_PIPYPM_CD,
        doctorName: row.YSMC,
        refundStatus: row.SD_APPTSTATUS_CD,
        visitTime: row.JZSJ,
        visitId: row.ID_VISMED,
        idAppt: row.ID_APPT
      })),
      total,
      pageSize,
      current
    });
  } catch (error) {
    console.error('查询停诊患者失败:', error);
    return NextResponse.json(
      { error: '查询停诊患者失败' },
      { status: 500 }
    );
  }
}

// 添加新的API端点，用于执行用户提供的SQL查询
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id_tet, endDay } = body;

    if (!id_tet || !endDay) {
      return NextResponse.json(
        { error: '缺少必要参数 id_tet 或 endDay' },
        { status: 400 }
      );
    }

    // 构建SQL查询
    const sql = `
      SELECT appt.* 
      FROM hi_appt appt 
      WHERE appt.id_tet = :1
        AND appt.insert_time <= TO_DATE(:2, 'YYYY-MM-DD HH24:MI:SS')
        AND (appt.id_vismed IS NULL OR appt.id_vismed = '')
        AND appt.delete_flag = '0' 
        AND appt.SD_APPTSTATUS_CD = '1' 
        AND appt.fg_pay = '0'
      ORDER BY appt.insert_time ASC
    `;

    console.log('执行SQL查询:', sql);
    console.log('查询参数:', [id_tet, endDay]);

    const result = await query(sql, [id_tet, endDay]);
    
    console.log('查询结果:', {
      rowCount: result.rows?.length || 0,
      metaData: result.metaData
    });

    return NextResponse.json({
      success: true,
      data: result.rows,
      total: result.rows?.length || 0
    });
  } catch (error) {
    console.error('执行SQL查询失败:', error);
    return NextResponse.json(
      { error: '执行SQL查询失败' },
      { status: 500 }
    );
  }
} 