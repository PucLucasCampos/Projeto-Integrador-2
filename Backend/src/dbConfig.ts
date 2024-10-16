import OracleDB from "oracledb";
OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;

export const config: OracleDB.ConnectionAttributes = {
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONN_STR
}