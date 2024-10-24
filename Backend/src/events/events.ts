import { Request, RequestHandler, Response } from "express";
import OracleDB from "oracledb";
import { dbConfig } from "../dbConfig";
import { CustomRequest } from "../types";
import { AccountsHandler } from "../accounts/accounts";
import { resolve } from "path";

export namespace EventHandler {
   /**
    * Tipo Event
    */
   export type Event = {
      id: number;
      titulo: string;
      descricao: string;
      valorCota: number;
      dataInicio: Date;
      dataFim: Date;
      data: Date;
      status: boolean;
   };

   export const getAllEvents = async (req: Request, res: Response): Promise<void> => {
      let connection;

      try {
         connection = await OracleDB.getConnection(dbConfig);

         const eParam = req.get("parametro");

         const sql: string = `
         SELECT 
            A.ID AS accountID, 
            A.EMAIL, 
            A.NAME, 
            A.BIRTHDAY, 
            B.ID AS betID, 
            B.valor AS betValue, 
            E.ID AS eventID, 
            E.titulo AS eventTitle, 
            E.descricao AS eventDescription, 
            E.valorCota, 
            E.dataInicio, 
            E.dataFim, 
            E.dataCriacao, 
            E.status
         FROM 
            ACCOUNTS A
         LEFT JOIN 
            BETS B ON A.ID = B.accountsID
         LEFT JOIN 
            EVENTS E ON B.eventoID = E.ID
         WHERE 
            E.status = :param
         `;

         if (
            eParam == "awaiting approval" ||
            eParam == "already occurred" ||
            eParam == "futures"
         ) {
            const result: Event[] | unknown = (await connection.execute(sql, [eParam]))
               .rows;
            res.status(200).send({
               code: res.statusCode,
               msg: "Resultado da busca Eventos",
               events: result,
            });
         } else {
            res.status(400).send({
               code: res.statusCode,
               msg: "Parametro não econtrado",
            });
            return;
         }
      } catch (err) {
         console.log(err);
      } finally {
         if (connection) {
            try {
               await connection.close();
            } catch (err) {
               console.log(err);
            }
         }
      }
   };

   export const postAddEventRoute: RequestHandler = async (
      req: CustomRequest,
      res: Response
   ) => {
      let connection;
      try {
         const { titulo, descricao, valorCota, dataInicio, dataFim, dataCriacao } =
            req.body;

         if (
            titulo != "" &&
            descricao != "" &&
            dataInicio != "" &&
            dataFim != "" &&
            dataCriacao != "" &&
            req.body &&
            req.account
         ) {
            connection = await OracleDB.getConnection(dbConfig);

            let cota = valorCota ? valorCota : 0;
            const account = req.account;

            const sql: string = `
                    INSERT INTO EVENTS
                    (
                        ID,
                        TITULO,
                        DESCRICAO,
                        VALORCOTA,
                        DATAINICIO,
                        DATAFIM,
                        DATACRIACAO,
                        STATUS,
                        ACCOUNTSID
                    ) VALUES (
                        SEQ_EVENTS.NEXTVAL,
                        :titulo,
                        :descricao,
                        :valorCota,
                        TO_DATE(:dataInicio, 'YYYY-MM-DD'),
                        TO_DATE(:dataFim, 'YYYY-MM-DD'),
                        TO_DATE(:dataCriacao, 'YYYY-MM-DD'),
                        'awaiting approval',
                        :accountId
                    )
                `;

            await connection.execute(
               sql,
               [titulo, descricao, cota, dataInicio, dataFim, dataCriacao, account.id],
               { autoCommit: true }
            );

            res.status(200).send({
               code: res.statusCode,
               msg: "Evento criado com sucesso",
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

   export const deleteEvent = async (
      req: CustomRequest,
      res: Response
   ): Promise<void> => {
      let connection;

      try {
         connection = await OracleDB.getConnection(dbConfig);

         const eTitulo = req.get("titulo");
         const eEmail = req.get("email");
         const ePassword = req.get("password");

         const sql = `
            UPDATE EVENTS
            SET status = 'deleted'
            WHERE titulo = :titulo
         `;

         if (eEmail && ePassword && eTitulo && req.account) {
            if (req.account.role == "moderador") {
               //Verificar se ele nao foi aprovado
               //Verificar se ele nao tem aposta
               const result = await connection.execute(sql, [eTitulo], {
                  autoCommit: true,
               });
               res.status(200).send({
                  code: res.statusCode,
                  msg: "Evento deletado com sucesso",
               })
            } else {
               res.status(400).send({
                  code: res.statusCode,
                  msg: "Acesso negado, você não é moderador",
               })
            }
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
