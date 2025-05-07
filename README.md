连接池创建成功
Database error: Error: ORA-12704: 字符集不匹配  （这是case里的问题，并非连接问题）
app
   stop  停诊患者清单（给第三方退款，日期查询）
   fd-refund  方鼎退款 (里面还有个modal显示退费日志)
   refund-log 退费日志
   schedule  排班界面，支持编辑
   pati  (显示员工信息,也是临时用，只是一个初始版本）
      -/api/patients
api
   /api/refund  （内部调用exchange.holdBackRpc/doNowRefund、会写日志表          （REFUND_REQUEST_LOG）

全局配置   env 
    https://hihis.smukqyy.cn/*.jsonRequest

TODO:
    token 还没有取到
退费

query (这是router.ts)，查询员工信息（只是一个模板） 应该没用
25.5.7
增加了两个环境 （但还是没有达到效果）
http://your-domain/query?env=test
http://your-domain/query?env=prod

如果不带 env 参数，默认会使用生产环境（prod）。
25.4.11
增加了停诊原因，和医生操作停诊时间

TODO:
患者退费时间
This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
