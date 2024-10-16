import OracleDB from "oracledb";
import dotenv from "dotenv";
dotenv.config();
OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;

export const dbConfig: OracleDB.ConnectionAttributes = {
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONN_STR
}