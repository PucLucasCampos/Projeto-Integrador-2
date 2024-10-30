import e, { Request, RequestHandler, Response } from "express";
import OracleDB from "oracledb";
import { dbConfig } from "../dbConfig";
import { CustomRequest } from "../types";
import { AccountsHandler } from "../accounts/accounts";
import { resolve } from "path";
import { sendEmail } from "../utils";

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
            E.ID AS "id",
            E.TITULO AS "titulo",
            E.DESCRICAO AS "descricao",
            E.VALORCOTA AS "valorCota",
            E.DATAINICIO AS "dataInicio",
            E.DATAFIM AS "dataFim",
            E.STATUS AS "status",
            A.ID AS "accountId",
            A.NAME AS "name",
            A.EMAIL AS "email",
            B.ID AS "betId",
            COALESCE(SUM(B.VALOR), 0) AS "valorApostado"
         FROM EVENTS E
            JOIN ACCOUNTS A ON A.ID = E.ACCOUNTSID
            LEFT JOIN BETS B ON B.ID = E.ID
         WHERE 
            E.STATUS = :param
         GROUP BY 
            E.ID, E.TITULO, E.DESCRICAO, E.VALORCOTA, E.DATAINICIO, E.DATAFIM, E.STATUS,
            A.ID, A.NAME, A.EMAIL, B.ID
         `;

         if (
            eParam == "awaiting approval" ||
            eParam == "already occurred" ||
            eParam == "futures" ||
            eParam == "deleted" ||
            eParam == "approved"
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

         const eId = req.get("id");

         const event = await checkEvent(eId);

         const updateSql = `
            UPDATE EVENTS
            SET status = 'deleted'
            WHERE ID = :eId
         `;

         if (eId && req.account) {
            if (req.account.role == "moderador") {
               if (event && event.length > 0) {
                  await connection.execute(updateSql, [eId], {
                     autoCommit: true,
                  });
                  res.status(200).send({
                     code: res.statusCode,
                     msg: "Evento deletado com sucesso",
                  });
               } else {
                  res.status(400).send({
                     code: res.statusCode,
                     msg: "Evento não existe",
                  });
               }
            } else {
               res.status(400).send({
                  code: res.statusCode,
                  msg: "Acesso negado, você não é moderador",
               });
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

   export const evaluateNewEvent = async (
      req: CustomRequest,
      res: Response
   ): Promise<void> => {
      let connection;

      try {
         connection = await OracleDB.getConnection(dbConfig);

         const eAvaliar = req.get("avaliar");
         const eId = req.get("id");

         const event = await checkEvent(eId);

         const updateSql = `
         UPDATE EVENTS 
         SET STATUS = 'approved' 
         WHERE ID = :eId
         `;

         if (req.account) {
            if (req.account.role == "moderador") {
               if (event && event.length > 0) {
                  if (eAvaliar == "aprovado") {
                     await connection.execute(updateSql, [eId], {
                        autoCommit: true,
                     });
                     res.status(200).send({
                        code: res.statusCode,
                        msg: "Evento Aprovado com Sucesso!",
                     });
                  } else if (eAvaliar == "reprovado") {
                     const email: boolean = await sendEmail(
                        req.account.email,
                        "Aviso de Reprovação de Evento",
                        `Prezado(a) Usuario(a), \nesperamos que esta mensagem o(a) encontre bem; \ninformamos que seu evento, intitulado ${event[0].titulo}, foi reprovado em nosso sistema de avaliação, possivelmente por não conformidades com os critérios estabelecidos para aprovação; \na reprovação, no entanto, não impede que você o reenvie após ajustes, e recomendamos revisar as diretrizes de nossos eventos para garantir alinhamento; \nagradecemos sua compreensão e esperamos continuar colaborando com você. \nAtenciosamente, Equipe de Avaliação de Eventos`
                     );

                     let msgEmail: string;
                     if (email) {
                        msgEmail = "E-mail de Reprovação enviado com sucesso!";
                     } else {
                        msgEmail = "Falha ao enviar e-mail de Reprovação!";
                     }
                     res.status(400).send({
                        code: res.statusCode,
                        msg: "Evento Reprovado!",
                        msgEmail: msgEmail,
                     });
                  }
               } else {
                  res.status(400).send({
                     code: res.statusCode,
                     msg: "Evento não existe",
                  });
               }
            } else {
               res.status(400).send({
                  code: res.statusCode,
                  msg: "Acesso negado, você não é moderador",
               });
            }
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

   async function checkEvent(eId: string | undefined) {
      let connection;

      try {
         connection = await OracleDB.getConnection(dbConfig);

         const sql: string = `
         SELECT * FROM EVENTS WHERE ID = :eId 
         `;

         const result = (await connection.execute(sql, [eId])).rows as Event[];
         return result;
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
   }

   export const finishEvent = async (req: Request, res: Response): Promise<void> => {
      let connection;

      try{
         connection = await OracleDB.getConnection(dbConfig);

         const eId = req.get("id");
         
      }catch (err) {
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
   }

   export const searchEvent = async (req: Request, res: Response): Promise<void> => {
      let connection;
  
      try {
         connection = await OracleDB.getConnection(dbConfig);
  
         const searchParam = req.query.search as string; 
  
         if (!searchParam || searchParam.trim() === "") {
            return res.status(400).send({
               code: 400,
               msg: "O parâmetro de busca é obrigatório.",
            });
         }
  
         const sql: string = `
            SELECT 
               E.ID AS "id",
               E.TITULO AS "titulo",
               E.DESCRICAO AS "descricao",
               E.VALORCOTA AS "valorCota",
               E.DATAINICIO AS "dataInicio",
               E.DATAFIM AS "dataFim",
               E.STATUS AS "status"
            FROM EVENTS E
            WHERE 
               LOWER(E.TITULO) LIKE '%' || :search || '%' 
               OR LOWER(E.DESCRICAO) LIKE '%' || :search || '%'
             `;
  
         const result = await connection.execute(sql, {
            search: searchParam.toLowerCase(),
         });
  
         if (result.rows && result.rows.length > 0) {
            res.status(200).send({
               code: 200,
               msg: "Eventos encontrados",
               events: result.rows,
            });
         } else {
            res.status(404).send({
               code: 404,
               msg: "Nenhum evento encontrado para o termo buscado.",
            });
          
      }
   } catch (err) {
      console.log(err);
      }finally {
         if (connection) {
            try {
               await connection.close();
            } catch (err) {
               console.log(err);
            }
         }
      }
   }
}
