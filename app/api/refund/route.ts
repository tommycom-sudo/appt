import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  let requestBody: any;
  try {
    requestBody = await request.json();
    console.log('退费请求体:', requestBody);
    
    const headersList = headers();
    const ipAddress = headersList.get('x-forwarded-for') || 'unknown';
    console.log('客户端IP:', ipAddress);
    
    // 记录请求日志
    const logSql = `
      INSERT INTO REFUND_REQUEST_LOG (
        ID_VISMED,
        IP_ADDRESS,
        OPERATOR,
        REQUEST_CONTENT,
        REQUEST_RESULT,
        RESPONSE_CONTENT,
        ERROR_MESSAGE
      ) VALUES (
        :1, :2, :3, :4, :5, :6, :7
      )
    `;
    
    // 调用退费接口
    console.log('开始调用退费接口...');
    const apiUrl = process.env.NEXT_PUBLIC_REFUND_API_URL;
    if (!apiUrl) {
      throw new Error('API地址未配置');
    }
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
        'Connection': 'keep-alive',
        'Cookie': 'tk=66f4fbe6f576a100150e7ef9',
        'Origin': 'https://hihistest.smukqyy.cn',
        'Referer': 'https://hihistest.smukqyy.cn/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0',
        'X-Service-Id': 'exchange.holdBackRpc',
        'X-Service-Method': 'doNowRefund',
        'content-Type': 'application/json',
        'encoding': 'utf-8',
        'sec-ch-ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Microsoft Edge";v="128"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('退费接口响应状态:', response.status);
    const responseData = await response.json();
    console.log('退费接口响应数据:', responseData);
    
    // 处理特殊响应情况
    let specialMessage = null;
    let errorMsg = null;
    if (responseData.code === 200 && responseData.body) {
      try {
        const bodyData = JSON.parse(responseData.body);
        if (bodyData.status === 'CANCEL') {
          specialMessage = '退费失败，原因：'+ bodyData.finishData;
          errorMsg = bodyData.finishData;
        }
      } catch (e) {
        console.error('解析响应体失败:', e);
      }
    }
    
    // 记录响应结果
    const requestResult = response.ok ? 'SUCCESS' : 'FAIL';
    const errorMessage = errorMsg || (response.ok ? null : JSON.stringify(responseData));
    
    // 执行日志插入
    console.log('开始插入日志...');
    const logParams = [
      requestBody[0]?.idVismed || 'UNKNOWN',
      ipAddress,
      'SYSTEM', // 这里可以替换为实际的用户信息
      JSON.stringify(requestBody),
      requestResult,
      JSON.stringify(responseData),
      errorMessage
    ];
    console.log('日志参数:', logParams);
    
    const logResult = await query(logSql, logParams);
    console.log('日志插入结果:', logResult);
    
    return NextResponse.json({
      ...responseData,
      specialMessage
    });
  } catch (error) {
    console.error('退费请求失败:', error);
    
    // 记录错误日志
    try {
      console.log('开始插入错误日志...');
      const logSql = `
        INSERT INTO REFUND_REQUEST_LOG (
          ID_VISMED,
          IP_ADDRESS,
          OPERATOR,
          REQUEST_CONTENT,
          REQUEST_RESULT,
          ERROR_MESSAGE
        ) VALUES (
          :1, :2, :3, :4, :5, :6
        )
      `;
      
      const headersList = headers();
      const ipAddress = headersList.get('x-forwarded-for') || 'unknown';
      
      const errorLogParams = [
        'UNKNOWN',
        ipAddress,
        'SYSTEM',
        JSON.stringify(requestBody || {}),
        'FAIL',
        error instanceof Error ? error.message : String(error)
      ];
      console.log('错误日志参数:', errorLogParams);
      
      const errorLogResult = await query(logSql, errorLogParams);
      console.log('错误日志插入结果:', errorLogResult);
    } catch (logError) {
      console.error('记录日志失败:', logError);
    }
    
    return NextResponse.json(
      { error: '退费请求失败' },
      { status: 500 }
    );
  }
} 