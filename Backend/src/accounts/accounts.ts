import { Request, RequestHandler, Response } from "express";
import OracleDB from "oracledb";
import dotenv from "dotenv";
dotenv.config();

/*
    Nampespace que contém tudo sobre "contas de usuários"
*/
export namespace AccountsHandler {
  /**
   * Tipo UserAccount
   */
  export type UserAccount = {
    id: number | undefined;
    completeName: string;
    email: string;
    password: string | undefined;
  };

  async function login(email: string, password: string) {
    OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;

    let connection = await OracleDB.getConnection({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONN_STR,
    });

    const result = await connection.execute(
      `
            SELECT * 
            FROM ACCOUNTS 
            WHERE email = :email and password = :password
          `,
      [email, password]
    );

    const linhas = result.rows;

    console.dir(linhas, { depth: null })

    await connection.close();

    return;
  }

  export const loginHandler: RequestHandler = async (
    req: Request,
    res: Response
  ) => {
    const pEmail = req.get("email");
    const pPassword = req.get("password");
    if (pEmail && pPassword) {
      const authData = login(pEmail, pPassword);

      res.status(200).send({ msg: "Função login", authData });
    } else {
      res.statusCode = 400;
      res.send("Requisição inválida - Parâmetros faltando.");
    }
  };
}
