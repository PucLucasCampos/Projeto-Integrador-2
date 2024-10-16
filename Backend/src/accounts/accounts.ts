import { Request, RequestHandler, Response } from "express";
import OracleDB from "oracledb";
import { config } from "../dbConfig";


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
    let connection = await OracleDB.getConnection(config);

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
