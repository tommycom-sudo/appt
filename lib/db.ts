import oracledb from 'oracledb';

// 数据库连接配置
const dbConfig = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONNECTION_STRING,
  autoCommit: true,
  poolMin: 2,
  poolMax: 5,
  poolIncrement: 1
};

// 定义查询结果类型
interface QueryResult {
  rows: any[][];
  metaData?: any[];
}

// 定义用户类型
interface User {
  id_user: string;
  id_tet: string;
  cd: string;
  na: string;
  mobile: string;
  sd_idtp: string;
  idno: string;
  email: string;
  avatar: string;
  fg_active: string;
  dt_create: string;
  dt_modify: string;
  fg_pwdinit: string;
}

// 创建连接池
let pool: oracledb.Pool;

async function initPool() {
  try {
    pool = await oracledb.createPool(dbConfig);
    console.log('连接池创建成功');
  } catch (err) {
    console.error('连接池创建失败:', err);
    throw err;
  }
}

// 初始化连接池
initPool();

// 执行 SQL 查询
export async function query(sql: string, params: any[] = []): Promise<QueryResult> {
  let connection;
  try {
    // 从连接池获取连接
    connection = await pool.getConnection();
    const result = await connection.execute(sql, params, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });
    return result as QueryResult;
  } finally {
    if (connection) {
      try {
        // 将连接返回到连接池
        await connection.close();
      } catch (err) {
        console.error('关闭连接错误:', err);
      }
    }
  }
}

// 获取所有用户
export async function getAllUsers(): Promise<User[]> {
  let connection;
  try {
    connection = await pool.getConnection();
    const result = await connection.execute(
      `SELECT * FROM bbp.hi_sys_user`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows as User[];
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