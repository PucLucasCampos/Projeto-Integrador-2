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
    valorAdd: number,
    walletId: number
  ): Promise<boolean> {
    let connection;

    try {
      connection = await OracleDB.getConnection(dbConfig);

      const sql: string = `
        UPDATE WALLET
        SET SALDO = SALDO + :valorAdd 
        WHERE ID = :walletId
      `;

      // const sql: string = `
      //   UPDATE historico_wallet
      //   SET valorAdd = :valorAdd
      //   WHERE USER_ID = :userId
      // `;

      const result = (
        await connection.execute(sql, [valorAdd, walletId], {
          autoCommit: true,
        })
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

  export const addFundsHandler: RequestHandler = async (
    req: CustomRequest,
    res: Response
  ) => {
    const valorAdd = req.get("valorAdd");

    if (valorAdd && req.account?.walletId) {
      const walletId = req.account.walletId;

      if (Number(valorAdd) <= 0) {
        res.status(400).send({
          code: res.statusCode,
          msg: "Parametros invalidos",
        });
      }

      const success = await addFundsWallet(Number(valorAdd), walletId);

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
    } else {
      res.status(400).send({
        code: res.statusCode,
        msg: "Parametros invalidos",
      });
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
    walletId: number,
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
        UPDATE WALLET
        SET SALDO = SALDO - :valorSacar
        WHERE ID = :walletId
      `;

      const result = (
        await connection.execute(sql, [valorSacar, walletId], {
          autoCommit: true,
        })
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

  export const withdrawFundsHandler: RequestHandler = async (
    req: CustomRequest,
    res: Response
  ) => {
    const valorSacar = req.get("valorSacar");

    if (valorSacar && req.account?.walletId) {
      const walletId = req.account.walletId;

      if (Number(valorSacar) <= 0) {
        res.status(400).send({
          code: res.statusCode,
          msg: "Parametros invalidos",
        });
      }

      const success = await withdrawFundsWallet(walletId, Number(valorSacar));

      if (success) {
        res.status(200).send({
          code: res.statusCode,
          msg: "Fundos retirados com sucesso!",
        });
      } else {
        res.status(500).send({
          code: res.statusCode,
          msg: "Erro ao retirar fundos.",
        });
      }
    } else {
      res.status(400).send({
        code: res.statusCode,
        msg: "Parametros invalidos",
      });
    }
  };

  async function betOnEvent(
    userId: number,
    eventoId: number,
    valorAposta: number,
    choice: number
  ): Promise<boolean> {
    let connection;

    try {
      connection = await OracleDB.getConnection(dbConfig);

      const sql: string = `
        SELECT ID, saldo FROM WALLET WHERE USERID = :userId
      `;

      const result = (await connection.execute(sql, [userId])).rows as [
        { ID: number; SALDO: number }
      ];

      if (result && result.length > 0) {
        const wallet = result[0];

        const saldoAtual = wallet.SALDO;
        if (saldoAtual && saldoAtual < valorAposta) {
          return false;
        }

        const resultAposta = await connection.execute(
          `INSERT INTO BETS (ID, VALOR, CHOICE, EVENTOID, ACCOUNTSID)
           VALUES (SEQ_ACCOUNTS.NEXTVAL, :valorAposta, :choice, :eventoId, :userId)`,
          [valorAposta, choice, eventoId, userId],
          { autoCommit: true }
        );

        await connection.execute(
          `UPDATE WALLET SET SALDO = SALDO - :valorAposta WHERE ID = :walletId`,
          [valorAposta, wallet.ID],
          { autoCommit: true }
        );

        if (resultAposta) {
          return true;
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

    return false;
  }

  export const betOnEventHandler: RequestHandler = async (
    req: CustomRequest,
    res: Response
  ) => {
    const { eventoId, valorAposta, choice } = req.body;

    const account = req.account;

    if (eventoId && valorAposta && account && choice) {
      const choiceBool: number = choice.toLowerCase() == "sim" ? 1 : 0

      const sucesso = await betOnEvent(
        account.id,
        eventoId,
        Number(valorAposta),
        choiceBool
      );

      res.status(sucesso ? 200 : 500).send({
        code: res.statusCode,
        msg: sucesso
          ? "Aposta realizada com sucesso!"
          : "Erro ao processar aposta",
      });
    } else {
      res
        .status(400)
        .send({ code: res.statusCode, msg: "Parâmetros inválidos" });
    }
  };
}
