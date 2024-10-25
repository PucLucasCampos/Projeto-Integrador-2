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


    const wallet = req.get("walletId")
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
}
