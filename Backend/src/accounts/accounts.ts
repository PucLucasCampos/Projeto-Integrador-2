import { NextFunction, Request, RequestHandler, Response } from "express";
import OracleDB from "oracledb";
import { dbConfig } from "../dbConfig";
import { CustomRequest } from "../types";

/*
    Nampespace que contém tudo sobre "contas de usuários"
*/
export namespace AccountsHandler {
  /**
   * Tipo UserAccount
   */
  export type UserAccount = {
    id: number;
    name: string;
    email: string;
    password?: string;
    birthday: string;
    token?: string;
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

  /**
   * Realizar o login
   * @param email
   * @param password
   * @returns
   */
  async function login(
    email: string,
    password: string
  ): Promise<UserAccount[]> {
    let connection;

    try {
      connection = await OracleDB.getConnection(dbConfig);

      const sql: string = `
        SELECT 
         ID as "id",
          EMAIL as "email",  
          NAME as "name",    
          BIRTHDAY as "birthday",
          TOKEN as "token" 
        FROM ACCOUNTS 
        WHERE email = :email and password = :password
      `;

      const authAccount = (await connection.execute(sql, [email, password]))
        .rows as UserAccount[];

      return authAccount;
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

    return [];
  }

  export const loginHandler: RequestHandler = async (
    req: Request,
    res: Response
  ) => {
    const pEmail = req.get("email");
    const pPassword = req.get("password");

    if (pEmail && pPassword) {
      const authData = await login(pEmail, pPassword);

      if (authData.length > 0)
        res.status(200).send({
          code: res.statusCode,
          msg: "Login realizado com sucesso!",
          token: authData[0].token,
        });
      else
        res
          .status(401)
          .send({ code: res.statusCode, msg: "Usuário ou senha incorretos." });
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
          ID as "id",
          EMAIL as "email",  
          NAME as "name",    
          BIRTHDAY as "birthday",
          ROLE as "role"
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
   * Rota busca usuario cadastrado
   * @param req
   * @param res
   */
  export const getAccountRoute: RequestHandler = async (
    req: CustomRequest,
    res: Response
  ): Promise<void> => {
    let connection;

    try {
      const pToken = req.token;

      if (pToken) {
        connection = await OracleDB.getConnection(dbConfig);

        const sql: string = `
          SELECT 
            ID as "id",
            EMAIL as "email",
            NAME as "name",
            BIRTHDAY as "birthday",
            ROLE as "role"
          FROM ACCOUNTS WHERE TOKEN = :token
        `;

        const result = (await connection.execute(sql, [pToken]))
          .rows as UserAccount[];

        res.status(200).send({
          code: res.statusCode,
          msg: "Resultado da busca usuarios",
          usuarios: result,
        });
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
      const pName = req.get("name");
      const pEmail = req.get("email");
      const pPassword = req.get("password");
      const pBirthday = req.get("birthday");
      const pRole = req.get("role");

      if (pEmail && pPassword && pName && pBirthday && pRole) {
        connection = await OracleDB.getConnection(dbConfig);

        if (!(await verifyAccount(pEmail))) {
          const sql: string = `
          INSERT INTO ACCOUNTS (ID, EMAIL, PASSWORD, NAME, BIRTHDAY, ROLE, TOKEN) VALUES
          (
              SEQ_ACCOUNTS.NEXTVAL,
              :email,
              :password,
              :name,
              TO_DATE(:birthday, 'YYYY-MM-DD'),
              :role,
              dbms_random.string('x',64)
          )
        `;

          await connection.execute(
            sql,
            [pEmail, pPassword, pName, pBirthday, pRole],
            {
              autoCommit: true,
            }
          );

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

  /**
   * Verificar se o usuário tem acesso ou não pelo token
   * @param pToken
   */
  export async function verifyToken(
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
      res
        .status(401)
        .json({ code: res.statusCode, msg: "Usuario não autorizado!" });
      return;
    }

    const token = authHeader.split(" ")[1];

    const account = await getAccountToken(token);

    if (account && account.length > 0) {
      req.token = token;
      req.account = account[0];
    }

    next();
  }

  /**
   * Buscar usuário pelo token
   * @param pToken
   */
  async function getAccountToken(pToken: string) {
    let connection;

    try {
      connection = await OracleDB.getConnection(dbConfig);

      const sql: string = `
        SELECT id, email, name, birthday FROM ACCOUNTS WHERE token = :token
      `;

      const result = (await connection.execute(sql, [pToken]))
        .rows as UserAccount[];

      return result;
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
  }
}
