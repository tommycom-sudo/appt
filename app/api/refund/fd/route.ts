import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { headers } from 'next/headers';

// 重试函数
async function tryAgainFdAggrPay(attempt: number, url: string, params: any) {
  try {
    console.log(`[FD方鼎退款]第${attempt}次重试...`);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    });

    const responseData = await response.json();
    const status = responseData.status?.toString().split('.')[0];

    if (status === '200') {
      console.log(`[FD方鼎退款]第${attempt}次重试成功`);
      return {
        success: true,
        data: responseData.response
      };
    }

    return {
      success: false,
      error: responseData
    };
  } catch (error) {
    console.error(`[FD方鼎退款]第${attempt}次重试失败:`, error);
    return {
      success: false,
      error
    };
  }
}

// 延迟函数
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: Request) {
  try {
    const requestBody = await request.json();
    console.log('[FD方鼎退款]请求参数:', requestBody);

    const {
      operatorId,
      orderNo,
      refundAmount,
      refundReason,
      idMedstoe
    } = requestBody;

    // 构建请求参数
    const wxParam = {
      operatorId,
      orderNo,
      refundAmount,
      refundReason
    };

    // 获取API地址
    const fdUrl = process.env.NEXT_PUBLIC_FD_REFUND_API_URL;
    if (!fdUrl) {
      throw new Error('方鼎退款API地址未配置');
    }

    console.log(`[FD方鼎退款][${idMedstoe}]退费推送参数:`, wxParam);

    // 第一次请求
    const response = await fetch(fdUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(wxParam)
    });

    let responseData;
    try {
      const responseText = await response.text();
      console.log(`[FD方鼎退款][${idMedstoe}]原始响应:`, responseText);
      
      if (!responseText) {
        throw new Error('API返回空响应');
      }
      
      responseData = JSON.parse(responseText);
    } catch (error) {
      console.error(`[FD方鼎退款][${idMedstoe}]解析响应失败:`, error);
      return NextResponse.json({
        success: false,
        error: '解析API响应失败',
        details: error instanceof Error ? error.message : '未知错误'
      }, { status: 500 });
    }

    console.log(`[FD方鼎退款][${idMedstoe}]退费推送回参:`, responseData);

    // 检查响应格式
    if (!responseData || typeof responseData.status === 'undefined') {
      return NextResponse.json({
        success: false,
        error: 'API返回格式不正确',
        response: responseData
      }, { status: 500 });
    }

    const status = responseData.status?.toString().split('.')[0];

    if (status === '200') {
      console.log(`[FD方鼎退款][${idMedstoe}]退费成功, 推送回参:`, responseData);
      return NextResponse.json({
        success: true,
        data: responseData.response
      });
    }

    // 重试逻辑
    console.log(`[FD方鼎退款][${idMedstoe}]退费失败, 开始重试...`);
    let tryAgainResponse = null;
    for (let i = 1; i <= 3; i++) {
      tryAgainResponse = await tryAgainFdAggrPay(i, fdUrl, wxParam);
      if (tryAgainResponse.success) {
        break;
      }
      await sleep(1000);
    }

    if (tryAgainResponse.success) {
      return NextResponse.json(tryAgainResponse);
    }

    return NextResponse.json({
      success: false,
      error: '退款请求失败，已重试3次'
    }, { status: 500 });

  } catch (error) {
    console.error('[FD方鼎退款]请求失败:', error);
    return NextResponse.json(
      { error: '退款请求失败' },
      { status: 500 }
    );
  }
} 