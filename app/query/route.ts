import oracledb from 'oracledb';
import { dbConfigs, Environment } from '../config/db';

// 存储不同环境的连接池
const pools: Record<Environment, oracledb.Pool | null> = {
  test: null,
  prod: null
};

// 创建连接池
async function initPool(env: Environment) {
  if (pools[env]) return pools[env];
  
  try {
    const pool = await oracledb.createPool(dbConfigs[env]);
    pools[env] = pool;
    console.log(`${env}环境连接池创建成功`);
    return pool;
  } catch (err) {
    console.error(`${env}环境连接池创建失败:`, err);
    throw err;
  }
}

async function listInvoices(env: Environment) {
  let connection;
  try {
    const pool = await initPool(env);
    connection = await pool.getConnection();
    const result = await connection.execute(
      `SELECT id_user, na FROM bbp.hi_sys_user where rownum <= 1000`
    );
    return result.rows;
  } catch (err) {
    console.error('数据库查询错误:', err);
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('关闭连接错误:', err);
      }
    }
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const env = (url.searchParams.get('env') || 'prod') as Environment;
    
    if (!['test', 'prod'].includes(env)) {
      return Response.json({ 
        error: '无效的环境参数',
        details: 'env参数必须是test或prod'
      }, { status: 400 });
    }

    return Response.json(await listInvoices(env));
  } catch (error) {
    console.error('API错误:', error);
    return Response.json({ 
      error: '数据库操作失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}