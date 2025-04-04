import oracledb from 'oracledb';

// 配置Oracle连接
const dbConfig = {
	user: process.env.ORACLE_USER,
	password: process.env.ORACLE_PASSWORD,
	connectString: process.env.ORACLE_CONNECTION_STRING,
	autoCommit: true,
	poolMin: 2,
	poolMax: 5,
	poolIncrement: 1
};

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

async function listInvoices() {
	let connection;
	try {
		// 从连接池获取连接
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
				// 将连接返回到连接池
				await connection.close();
			} catch (err) {
				console.error('关闭连接错误:', err);
			}
		}
	}
}

export async function GET() {
	try {
		return Response.json(await listInvoices());
	} catch (error) {
		console.error('API错误:', error);
		return Response.json({ 
			error: '数据库操作失败',
			details: error instanceof Error ? error.message : '未知错误'
		}, { status: 500 });
	}
}
