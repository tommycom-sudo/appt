export const dbConfigs = {
  test: {
    user: process.env.ORACLE_USER_TEST,
    password: process.env.ORACLE_PASSWORD_TEST,
    connectString: process.env.ORACLE_CONNECTION_STRING_TEST,
    autoCommit: true,
    poolMin: 2,
    poolMax: 5,
    poolIncrement: 1
  },
  prod: {
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECTION_STRING,
    autoCommit: true,
    poolMin: 2,
    poolMax: 5,
    poolIncrement: 1
  }
};

export type Environment = 'test' | 'prod'; 