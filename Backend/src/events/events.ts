import e, { Request, RequestHandler, Response } from "express";
import OracleDB from "oracledb";
import { dbConfig } from "../dbConfig";
import { CustomRequest } from "../types";
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
    status: string;
  };

  type Apostarores = {
    id: number;
    valor: number;
    accountId: number;
    choice: number;
  };

  export const getAllEvents = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    let connection;

    try {
      connection = await OracleDB.getConnection(dbConfig);
    
      const eParam = req.get("parametro");
    
      let sql = `
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
            COUNT(B.ID) AS "qtdApostas",
            COALESCE(SUM(B.VALOR), 0) AS "valorApostado"
        FROM EVENTS E
            JOIN ACCOUNTS A ON A.ID = E.ACCOUNTSID
            LEFT JOIN BETS B ON B.EVENTOID = E.ID
      `;
    
      if (eParam) {
        if (eParam === "ending") {
          sql += `WHERE E.DATAFIM >= CURRENT_DATE `;
        } else if (eParam === "popular") {
          sql += `HAVING COUNT(B.ID) > 0 `;
        } else {
          sql += `WHERE E.STATUS = :param `;
        }
      }
    
      sql += `
      GROUP BY 
          E.ID, E.TITULO, E.DESCRICAO, E.VALORCOTA, E.DATAINICIO, E.DATAFIM, E.STATUS,
          A.ID, A.NAME, A.EMAIL
      ORDER BY 
          COUNT(B.ID) DESC, 
          E.DATAFIM DESC  
    `;
    
      let result;
      if (eParam && eParam !== "ending" && eParam !== "popular") {
        result = (await connection.execute(sql, [eParam])).rows;
      } else {
        result = (await connection.execute(sql)).rows;
      }
    
      res.status(200).send({
        code: res.statusCode,
        search: eParam,
        msg: "Resultado da busca Eventos",
        events: result,
      });
    
    } catch (err) {
      console.log(err);
      res.status(500).send({
        code: 500,
        msg: "Erro interno do servidor",
      });
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          console.log("Erro ao fechar a conexão", err);
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
         SET STATUS = :status
         WHERE ID = :eId
         `;

      if (req.account && req.account.role == "moderador") {
        if (event && event.length > 0) {
          if (eAvaliar == "aprovado") {
            await connection.execute(updateSql, ["approved", eId], {
              autoCommit: true,
            });
            res.status(200).send({
              code: res.statusCode,
              msg: "Evento Aprovado com Sucesso!",
            });
          } else if (eAvaliar == "reprovado") {
            await connection.execute(updateSql, ["closed", eId], {
              autoCommit: true,
            });

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
            res.status(200).send({
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

  function betDistribution(
    betValue: number,
    sumTotalWin: number,
    sumTotalBet: number
  ): number {
    return (betValue / sumTotalWin) * sumTotalBet;
  }

  async function updateWallet(
    valueReceive: number,
    accountId: number
  ): Promise<boolean> {
    let connection;

    try {
      connection = await OracleDB.getConnection(dbConfig);

      const result = (
        await connection.execute(
          `UPDATE WALLET SET SALDO = SALDO + :valorReceber WHERE USERID = :accountId`,
          [valueReceive, accountId],
          { autoCommit: true }
        )
      ).rowsAffected;

      if (result && result > 0) {
        return true;
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

  export const finishEvent = async (
    req: CustomRequest,
    res: Response
  ): Promise<void> => {
    let connection;

    try {
      connection = await OracleDB.getConnection(dbConfig);

      const eId = req.get("eventId");
      const isOccurred = req.get("occurred");

      const event = await checkEvent(eId);

      const sql: string = `
         UPDATE EVENTS 
         SET STATUS = 'closed' 
         WHERE ID = :eId
         `;

      if (req.account && req.account.role == "moderador" && isOccurred) {
        if (event && event.length > 0) {
          const data = new Date();
          let dataFim = event[0].dataFim;

          if (data > dataFim) {
            await connection.execute(sql, [eId], { autoCommit: true });

            const sqlBettors: string = `
                  SELECT 
                     ID AS "id",
                     valor AS "valor",
                     accountsID AS "accountId",
                     choice AS "choice"
                  FROM BETS WHERE eventoID = :eventId
                  `;

            const bettors = (await connection.execute(sqlBettors, [eId]))
              .rows as Apostarores[];
            const choice = isOccurred.toLowerCase() == "sim" ? 1 : 0;

            const ganhadores: Apostarores[] = bettors.filter(
              (bet) => bet.choice == choice
            );

            const sumTotalWin = ganhadores.reduce(
              (previousValue: number, currentValue: Apostarores) => {
                return (previousValue += currentValue.valor);
              },
              0
            );

            const sumTotalBet = bettors.reduce(
              (previousValue: number, currentValue: Apostarores) => {
                return (previousValue += currentValue.valor);
              },
              0
            );

            bettors.forEach(async (Bettors) => {
              const { valor, choice, accountId } = Bettors;
              const valueReceive: number = betDistribution(
                valor,
                sumTotalWin,
                sumTotalBet
              );
              const isOccurredBool: number =
                isOccurred.toLowerCase() == "sim" ? 1 : 0;

              if (isOccurredBool == choice) {
                await updateWallet(valueReceive, accountId);
              }
            });
            res.status(200).send({
              code: res.statusCode,
              msg: "Evento Finalizado",
            });
          } else {
            res.status(400).send({
              code: res.statusCode,
              msg: `Não foi possivel encerrar o evento, encerrarmento somente depois da data ${dataFim.toLocaleDateString()}`,
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

  async function checkEvent(eId: string | undefined) {
    let connection;

    try {
      connection = await OracleDB.getConnection(dbConfig);

      const sql: string = `
         SELECT 
            ID as "id",
            TITULO as "titulo",
            DESCRICAO as "descricao",
            VALORCOTA as "valorCota",
            DATAINICIO as "dataInicio",
            DATAFIM as "dataFim",
            DATACRIACAO "dataCriacao",
            STATUS as "status",
            ACCOUNTSID as "accountId"
         FROM EVENTS WHERE ID = :eId 
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

  export const searchEvent = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    let connection;

    try {
      connection = await OracleDB.getConnection(dbConfig);

      const searchParam = req.query.search;

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
            COUNT(B.ID) AS "qtdApostas",
            COALESCE(SUM(B.VALOR), 0) AS "valorApostado"
         FROM EVENTS E
            JOIN ACCOUNTS A ON A.ID = E.ACCOUNTSID
            LEFT JOIN BETS B ON B.EVENTOID = E.ID
            WHERE 
               LOWER(E.TITULO) LIKE '%' || :search || '%' 
               OR LOWER(E.DESCRICAO) LIKE '%' || :search || '%'
               GROUP BY 
            E.ID, E.TITULO, E.DESCRICAO, E.VALORCOTA, E.DATAINICIO, E.DATAFIM, E.STATUS,
            A.ID, A.NAME, A.EMAIL
             `;

      if (searchParam && searchParam.toString().trim() != "") {
        const search = searchParam.toString().toLowerCase();

        const result = await connection.execute(sql, { search });

        if (result.rows && result.rows.length > 0) {
          res.status(200).send({
            code: 200,
            msg: "Eventos encontrados",
            events: result.rows,
          });
        } else {
          res.status(400).send({
            code: 400,
            msg: "Nenhum evento encontrado para o termo buscado.",
          });
        }
      } else {
        res.status(400).send({
          code: 400,
          msg: "O parâmetro de busca é obrigatório.",
        });
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
}
