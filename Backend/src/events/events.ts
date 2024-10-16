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

  export async function getAllEvents() {}

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
