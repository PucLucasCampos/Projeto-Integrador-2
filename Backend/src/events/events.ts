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
      dataInicio: string;
      dataFim: string;
      data: string;
      status: boolean;
   };

   export const getAllEvents = async (req: Request, res: Response): Promise<void> => {
      let connection;

      try {
         connection = await OracleDB.getConnection(dbConfig);

         const sql: string = `
            SELECT * FROM EVENTS
         `;

         const result: Event[] | unknown = (await connection.execute(sql)).rows;
         res.status(200).send({
            code: res.statusCode,
            msg: "Resultado da busca Eventos",
            events: result,
         });
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
}
