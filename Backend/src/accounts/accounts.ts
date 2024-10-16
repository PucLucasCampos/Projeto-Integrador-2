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

  /**
   * Função para verificar se o email existe.
   * @param pEmail email do usuário do tipo @type { string }
   * @returns @type { boolean } se existe algum email cadastrado ou não.
   */
  async function verifyAccount(pEmail: string): Promise<boolean> {
    let connection;

    try {
      connection = await OracleDB.getConnection(dbConfig);

      const sql: string = `
        SELECT TOKEN FROM ACCOUNTS WHERE email = :email
      `;

      const result = (await connection.execute(sql, [pEmail])).rows as [
        { TOKEN: string }
      ];

      if (result && result.length > 0) {
        return true;
      } else {
        return false;
      }
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

    return false;
  }

  async function login(email: string, password: string) {
    let connection = await OracleDB.getConnection(dbConfig);

    await connection.execute(
      `
            SELECT * 
            FROM ACCOUNTS 
            WHERE email = :email and password = :password
          `,
      [email, password]
    );

    await connection.commit();

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
   * Rota busca usuarios cadastrados
   * @param req
   * @param res
   */
  export const getAllAccountsRoute: RequestHandler = async (
    req: Request,
    res: Response
  ): Promise<void> => {
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

      const result = (await connection.execute(sql)).rows as UserAccount[];

      res.status(200).send({
        code: res.statusCode,
        msg: "Resultado da busca usuarios",
        usuarios: result,
      });
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

  /**
   * Rota cadastrar usuario
   * @param req
   * @param res
   */
  export const putCreateAccountsRoute: RequestHandler = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    let connection;

    try {
      const pEmail = req.get("email");
      const pPassword = req.get("password");
      const pName = req.get("name");

      if (pEmail && pPassword && pName) {
        connection = await OracleDB.getConnection(dbConfig);

        if (!(await verifyAccount(pEmail))) {
          const sql: string = `
          INSERT INTO ACCOUNTS (ID, EMAIL, PASSWORD, COMPLETE_NAME, TOKEN) VALUES
          (
              SEQ_ACCOUNTS.NEXTVAL,
              :email,
              :password,
              :name,
              dbms_random.string('x',64)
          )
        `;

          await connection.execute(sql, [pEmail, pPassword, pName], {
            autoCommit: true,
          });

          res.status(200).send({
            code: res.statusCode,
            msg: "Usuário criado com sucesso!",
          });
        } else {
          res.status(200).send({
            code: res.statusCode,
            msg: "Já existe um usuário com essas credênciais",
          });
        }
      } else {
        res.status(400).send({
          code: res.statusCode,
          msg: "Requisição inválida - Parâmetros faltando.",
        });
      }
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
