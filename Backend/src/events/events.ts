import { Request, RequestHandler, Response } from "express";
import OracleDB from "oracledb";
import { dbConfig } from "../dbConfig";

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
         SELECT * FROM EVENTS WHERE STATUS = :param
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
      req: Request,
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
            req.body
         ) {
            connection = await OracleDB.getConnection(dbConfig);

            let cota = valorCota ? valorCota : 0;

            const sql: string = `
                    INSERT INTO EVENTS
                    (
                        id,
                        titulo,
                        descricao,
                        valorCota,
                        dataInicio,
                        dataFim,
                        dataCriacao,
                        status
                    ) VALUES (
                        SEQ_EVENTS.NEXTVAL,
                        :titulo,
                        :descricao,
                        :valorCota,
                        TO_DATE(:dataInicio, 'YYYY-MM-DD'),
                        TO_DATE(:dataFim, 'YYYY-MM-DD'),
                        TO_DATE(:dataCriacao, 'YYYY-MM-DD'),
                        0
                    )
                `;

            await connection.execute(
               sql,
               [titulo, descricao, cota, dataInicio, dataFim, dataCriacao],
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

   // export const deleteEvent = async (req: Request, res: Response): Promise<void> => {
   //    let connection;

   //    try {
   //    } catch (err) {
   //    } finally {
   //    }
   // };
}
