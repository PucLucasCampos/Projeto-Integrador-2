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
      birthday: Date;
      role: string;
      token?: string;
      walletId?: number;
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
   async function login(email: string, password: string): Promise<UserAccount[]> {
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

   export const loginHandler: RequestHandler = async (req: Request, res: Response) => {
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
            res.status(401).send({
               code: res.statusCode,
               msg: "Usuário ou senha incorretos.",
            });
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

      const pToken = req.token;
      const pAccount = req.account;

      if (pToken && pAccount) {
         res.status(200).send({
            code: res.statusCode,
            msg: "Resultado da busca usuarios",
            usuarios: pAccount,
         });
      } else {
         res.status(400).send({
            code: res.statusCode,
            msg: "Requisição inválida - Parâmetros faltando.",
         });
      }
   };

   //  async function isOver18(pBirthday:) {
   //   const currentDate = new Date().getFullYear;
   //   if(pBirthday - currentDate)
   //  }

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
          
            const currentDate = new Date();
            const birthdayDate = new Date(pBirthday);
            if (birthdayDate > currentDate) {
               res.status(400).send({
                  code: res.statusCode,
                  msg: "Data de Aniversario Invalida.",
               });
               return;
            } else if (currentDate.getFullYear() - birthdayDate.getFullYear() < 18) {
              res.status(422).send({
                code: res.statusCode,
                msg: "Usuario menor de 18!",
             });
             return;
            }

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
          RETURNING ID INTO :id
          `;

               const bindParams = {
                  email: pEmail,
                  password: pPassword,
                  name: pName,
                  birthday: pBirthday,
                  role: pRole,
                  id: { dir: OracleDB.BIND_OUT, type: OracleDB.NUMBER }, // Captura o ID gerado
               };

               const newAccount = (await connection.execute(sql, bindParams, {
                  autoCommit: true,
               })) as { outBinds: { id: number[] } };

               const newAccountId = newAccount.outBinds.id[0];

               if (newAccountId) {
                  const sqlWallet: string = `
            INSERT INTO WALLET (ID, USERID, SALDO) VALUES
            (
                SEQ_WALLET.NEXTVAL,
                :accountId,
                0
            )
          `;

                  await connection.execute(sqlWallet, [newAccountId], {
                     autoCommit: true,
                  });
               }

               res.status(200).send({
                  code: res.statusCode,
                  msg: "Usuário criado com sucesso!",
               });
            } else {
               res.status(409).send({
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
         res.status(401).json({ code: res.statusCode, msg: "Usuario não autorizado!" });
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
        SELECT 
          a.id AS "id",
          a.email AS "email", 
          a.name AS "name", 
          a.birthday AS "birthday", 
          w.id AS "walletId",
          w.saldo AS "balance",
          a.role as "role"
        FROM ACCOUNTS a
        JOIN WALLET w ON a.id = w.userid 
        WHERE a.token = :token
      `;

         const result = (await connection.execute(sql, [pToken])).rows as UserAccount[];

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
