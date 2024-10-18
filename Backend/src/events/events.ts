import { Request, RequestHandler, Response } from "express";
import OracleDB from "oracledb";
import { dbConfig } from "../dbConfig";
import { CustomRequest } from "../types";

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

  export const getAllEvents = async (
    req: Request,
    res: Response
  ): Promise<void> => {
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
                valorCota,
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
          [
            titulo,
            descricao,
            cota,
            dataInicio,
            dataFim,
            dataCriacao,
            account.id,
          ],
          { autoCommit: true }
        );

        res
          .status(200)
          .send({ code: res.statusCode, msg: "Evento criado com sucesso" });
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
