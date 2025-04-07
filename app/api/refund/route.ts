import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const response = await fetch('https://hihistest.smukqyy.cn/*.jsonRequest', {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
        'Connection': 'keep-alive',
        'Cookie': 'tk=6683589ba6e7540015a3ab06',
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
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('退费请求失败:', error);
    return NextResponse.json(
      { error: '退费请求失败' },
      { status: 500 }
    );
  }
} 