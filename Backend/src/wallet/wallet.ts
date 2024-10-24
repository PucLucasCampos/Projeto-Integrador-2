import { NextFunction, Request, RequestHandler, Response } from "express";
import OracleDB from "oracledb";
import { dbConfig } from "../dbConfig";
import { CustomRequest } from "../types";

export namespace WalletHandler {
  export type UserWallet = {
    id: number;
    userId: string;
    saldo: string;
    token?: string;
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
    req: Request,
    res: Response
  ) => {
    const userId = req.get("userId");
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
}
