import { Request, RequestHandler, Response } from "express";
import OracleDB from "oracledb";
import { dbConfig } from "../dbConfig";

/*
    Nampespace que contém tudo sobre "contas de usuários"
*/
export namespace AccountsHandler {
  /**
   * Tipo UserAccount
   */
  export type UserAccount = {
    id: number;
    completeName: string;
    email: string;
    password: string;
  };

  async function login(email: string, password: string) {
    let connection = await OracleDB.getConnection(dbConfig);

    const result = await connection.execute(
      `
            SELECT * 
            FROM ACCOUNTS 
            WHERE email = :email and password = :password
          `,
      [email, password]
    );

    const linhas = result.rows;

    console.dir(linhas, { depth: null });

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

  /**
   * Buscar usuarios cadastrados
   * @param req 
   * @param res 
   */
  export const getAllAccountsRoute = async (req: Request, res: Response): Promise<void> => {
    let connection;

    try {
      connection = await OracleDB.getConnection(dbConfig);

      const sql: string = `
        SELECT 
          ID,
          EMAIL,
          COMPLETE_NAME,
          TOKEN 
        FROM ACCOUNTS
      `;

      const result: UserAccount[] | unknown = (await connection.execute(sql))
        .rows;

      res.status(200).send({ code: res.statusCode, msg: "Resultado da busca usuarios", usuarios: result });
    } catch (err) {
      console.error(err);
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          console.error(err);
        }
      }
    }
  };
}
