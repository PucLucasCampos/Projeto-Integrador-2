import { NextFunction, Request, RequestHandler, Response } from "express";
import OracleDB from "oracledb";
import { dbConfig } from "../dbConfig";
import { CustomRequest } from "../types";

export namespace WalletHandler {
  export type UserWallet = {
    id: number;
    userId: string;
    saldo: string;
  };

  async function addFundsWallet(
    userId: number,
    valorAdd: number
  ): Promise<boolean> {
    let connection;

    try {
      connection = await OracleDB.getConnection(dbConfig);

      const sql: string = `
        UPDATE WALLETS 
        SET SALDO = SALDO + :valorAdd 
        WHERE USER_ID = :userId
      `;

      // const sql: string = `
      //   UPDATE historico_wallet
      //   SET valorAdd = :valorAdd 
      //   WHERE USER_ID = :userId
      // `;

      const result = (
        await connection.execute(sql, [valorAdd, userId], { autoCommit: true })
      ).rows;

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

  export const addFundsHandler: RequestHandler = async (
    req: CustomRequest,
    res: Response
  ) => {


    const wallet = req.get("walletId");
    const userId = req.account?.id;
    const valorAdd = req.get("valorId");

    if (userId && valorAdd) {
      const numUserId = Number(userId);

      if (numUserId <= 0 || Number(valorAdd) <= 0) {
        res.status(400).send({
          code: res.statusCode,
          msg: "Parametros invalidos",
        });
        return;
      }

      const success = await addFundsWallet(numUserId, Number(valorAdd));

      if (success) {
        res.status(200).send({
          code: res.statusCode,
          msg: "Fundos adicionados com sucesso!",
        });
      } else {
        res.status(500).send({
          code: res.statusCode,
          msg: "Erro ao adicionar fundos.",
        });
      }
    }
  };


  // if (valorAdd <= 100) {
  //   valorAdd -= valorAdd * 0.04; 
  // } else if (valorAdd <= 1000) {
  //   valorAdd -= valorAdd * 0.03; 
  // } else if (valorAdd <= 5000) {
  //   valorAdd -= valorAdd * 0.02; 
  // } else if (valorAdd <= 100000) {
  //   valorAdd -= valorAdd * 0.01; 
  // }

  async function withdrawFundsWallet(
    userId: number,
    valorSacar: number
  ): Promise<boolean> {
    let connection;

    try {
      connection = await OracleDB.getConnection(dbConfig);

      if (valorSacar <= 100) {
        valorSacar -= valorSacar * 0.04; 
      } else if (valorSacar <= 1000) {
        valorSacar -= valorSacar * 0.03; 
      } else if (valorSacar <= 5000) {
        valorSacar -= valorSacar * 0.02; 
      } else if (valorSacar <= 100000) {
        valorSacar -= valorSacar * 0.01; 
      }

      const sql: string = `
        UPDATE WALLETS 
        SET SALDO = SALDO - :valorSacar
        WHERE USER_ID = :userId
      `;

      const result = (
        await connection.execute(sql, [valorSacar, userId], { autoCommit: true })
      ).rows;

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

  export const withdrawFundsHandler: RequestHandler = async (
    req: Request,
    res: Response
  ) => {
    const userId = req.get("userId");
    const valorSacar = req.get("valorSacar");

    if (userId && valorSacar) {
      const numUserId = Number(userId);

      if (numUserId <= 0 || Number(valorSacar) <= 0) {
        res.status(400).send({
          code: res.statusCode,
          msg: "Parametros invalidos",
        });
        return;
      }

      const success = await withdrawFundsWallet(numUserId, Number(valorSacar));

      if (success) {
        res.status(200).send({
          code: res.statusCode,
          msg: "Fundos adicionados com sucesso!",
        });
      } else {
        res.status(500).send({
          code: res.statusCode,
          msg: "Erro ao adicionar fundos.",
        });
      }
    }
  };

  // async function betOnEvent(
  //   userId: string,
  //   evento: string,
  //   valorAposta: number
  // ): Promise<boolean> {
  //   let connection;

  //   try {
  //     connection = await OracleDB.getConnection(dbConfig);

  //     const sql: string = `
  //       SELECT ID FROM ACCOUNT WHERE ID = :userId
  //     `;

  //     const result = (
  //       await connection.execute(sql, [userId])
  //     ).rows;

  //     if (result && result.length > 0) {
  //       return true;
  //     } else {
  //       return false;
  //     }

  //   } catch (err) {
  //     console.error(err);
  //   } finally {
  //     if (connection) {
  //       try {
  //         await connection.close();
  //       } catch (err) {
  //         console.error(err);
  //       }
  //     }
  //   }

  //   return false;
  // }

  // async function apostarEmEvento(
  //   emailApostador: string,
  //   evento: string,
  //   valorAposta: number
  // ): Promise<boolean> {
  //   let connection;
  //   try {
  //     // Conectar ao banco
  //     connection = await OracleDB.getConnection(dbConfig);

  //     // Buscar ID do usuário a partir do email na tabela ACCOUNT
  //     const accountResult = await connection.execute(
  //       `SELECT ID FROM ACCOUNT WHERE EMAIL = :email`,
  //       [emailApostador]
  //     );
  //     const userId = accountResult.rows[0]?.[0];
  //     if (!userId) return false;

  //     // Verificar o saldo na tabela WALLET usando o ID do usuário
  //     const walletResult = await connection.execute(
  //       `SELECT SALDO FROM WALLET WHERE USER_ID = :userId`,
  //       [userId]
  //     );
  //     const saldoAtual = parseFloat(walletResult.rows[0]?.[0]);
  //     if (isNaN(saldoAtual) || saldoAtual < valorAposta) return false;

  //     // Atualizar o saldo na tabela WALLET
  //     await connection.execute(
  //       `UPDATE WALLET SET SALDO = SALDO - :valorAposta WHERE USER_ID = :userId`,
  //       [valorAposta, userId],
  //       { autoCommit: true }
  //     );

  //     // Registrar a aposta na tabela APOSTAS
  //     await connection.execute(
  //       `INSERT INTO APOSTAS (USER_ID, EVENTO, VALOR_APOSTADO, DATA_APOSTA) 
  //        VALUES (:userId, :evento, :valorAposta, SYSDATE)`,
  //       [userId, evento, valorAposta],
  //       { autoCommit: true }
  //     );

  //     return true;
  //   } catch {
  //     return false;
  //   } finally {
  //     connection && (await connection.close());
  //   }
  // }

  // // Handler para a rota de aposta
  // export const apostarEventoHandler: RequestHandler = async (req, res) => {
  //   const { email, evento, valorAposta } = req.body;
  //   if (!email || !evento || !valorAposta || valorAposta <= 0) {
  //     return res.status(400).send({ msg: "Parâmetros inválidos" });
  //   }

  //   const sucesso = await apostarEmEvento(email, evento, Number(valorAposta));
  //   res.status(sucesso ? 200 : 500).send({
  //     msg: sucesso ? "Aposta realizada com sucesso!" : "Erro ao processar aposta",
  //   });
  // };
  
}
