import { NextFunction, Request, RequestHandler, Response } from "express";
import OracleDB from "oracledb";
import { dbConfig } from "../dbConfig";
import { CustomRequest } from "../types";

export namespace WalletHandler {
  /*
    Tipo UserWallet
   */
  export type UserWallet = {
    id: number;
    userId: string;
    saldo: string;
  };

  /*
    Tipo HistoricoWallet
  */
  type HistoricoWallet = {
    id: number;
    data: Date;
    descricao: string;
    valor: number;
  };

  /*
    Função para adicionar fundos a wallet
   */
  async function addFundsWallet(
    valorAdd: number,
    walletId: number,
    accountId: number,
    bancoNome: string,
    agencia: string,
    contaNumero: string
  ): Promise<boolean> {
    let connection;

    try {
      connection = await OracleDB.getConnection(dbConfig);

      const sql: string = `
        UPDATE WALLET
        SET SALDO = SALDO + :valorAdd 
        WHERE ID = :walletId
      `;

      const resultUpdateWallet = (
        await connection.execute(sql, [valorAdd, walletId], {
          autoCommit: true,
        })
      ).rowsAffected;

      const historicoWalletId = await createHistoricoWallet(
        Number(valorAdd),
        walletId,
        "deposito"
      );

      if (resultUpdateWallet && resultUpdateWallet > 0) {
        if (historicoWalletId > 0) {
          const bancoSql: string = `
            insert into
                bank_account (
                    id,
                    bancoNome,
                    agencia,
                    contaNumero,
                    historicoWalletID,
                    accountID
                )
            values (
                    seq_bank_account.nextval,
                    :bancoNome,
                    :agencia,
                    :contaNumero,
                    :historicoWalletId,
                    :accountId
                )
          `;
          await connection.execute(
            bancoSql,
            [bancoNome, agencia, contaNumero, historicoWalletId, accountId],
            {
              autoCommit: true,
            }
          );

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

  /*
   Função para lidar com a requisição de adição de fundos
  */
  export const addFundsHandler: RequestHandler = async (
    req: CustomRequest,
    res: Response
  ) => {
    const valorAdd = req.get("valorAdd");
    const bancoNome = req.get("bancoNome");
    const agencia = req.get("agencia");
    const contaNumero = req.get("contaNumero");

    if (
      valorAdd &&
      req.account?.walletId &&
      bancoNome &&
      agencia &&
      contaNumero
    ) {
      const walletId = req.account.walletId;
      const accountId = req.account.id;

      if (Number(valorAdd) <= 0) {
        res.status(400).send({
          code: res.statusCode,
          msg: "Parametros invalidos",
        });
      }

      const success = await addFundsWallet(
        Number(valorAdd),
        walletId,
        accountId,
        bancoNome,
        agencia,
        contaNumero
      );

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

  /*
    Função para sacar fundos da wallet
    Lógica para taxa ao sacar
   */
  async function withdrawFundsWallet(
    walletId: number,
    valorSacar: number
  ): Promise<boolean> {
    let connection;

    try {
      connection = await OracleDB.getConnection(dbConfig);

      if (valorSacar > 101000) {
        console.error("O valor máximo de saque diário é R$ 101.000,00.");
        return false;
      }

      let taxa = 0;
      if (valorSacar <= 100) {
        taxa = 0.04;
      } else if (valorSacar <= 1000) {
        taxa = 0.03;
      } else if (valorSacar <= 5000) {
        taxa = 0.02;
      } else if (valorSacar <= 100000) {
        taxa = 0.01;
      } else {
        taxa = 0; // Isento de taxa acima de R$ 101.000,00
      }

      const valorComTaxa = valorSacar * (1 - taxa);

      const sql: string = `
        UPDATE WALLET
        SET SALDO = SALDO - :valorSacar
        WHERE ID = :walletId
      `;

      const result = (
        await connection.execute(sql, [valorComTaxa, walletId], {
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

  export async function createHistoricoWallet(
    valorAdd: number,
    walletId: number,
    metodo: "saque" | "deposito" | "aposta"
  ): Promise<number> {
    let connection;

    try {
      connection = await OracleDB.getConnection(dbConfig);

      const sql: string = `
        INSERT INTO
            historico_wallet (
                id,
                dataTransferencia,
                valorAdd,
                walletId,
                tipoTransacao
            )
        VALUES (
                seq_historico_wallet.nextval,
                CURRENT_DATE,
                :valorAdd,
                :walletId,
                :metodo
            )
        RETURNING
            ID INTO:id
      `;

      const bindParams = {
        valorAdd,
        walletId,
        metodo,
        id: { dir: OracleDB.BIND_OUT, type: OracleDB.NUMBER }, // Captura o ID gerado
      };

      const newHistoricoWallet = (await connection.execute(sql, bindParams, {
        autoCommit: true,
      })) as { outBinds: { id: number[] } };

      return newHistoricoWallet.outBinds.id[0];
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

    return -1;
  }

  /*
   Função para lidar com a requisição de retirada de fundos
  */
  export const withdrawFundsHandler: RequestHandler = async (
    req: CustomRequest,
    res: Response
  ) => {
    let connection;

    try {
      connection = await OracleDB.getConnection(dbConfig);

      const valorSacar = req.get("valorSacar");
      const metodo = req.get("metodo"); // Banco || PIX

      if (
        metodo &&
        valorSacar &&
        req.account &&
        req.account.walletId &&
        req.account.balance
      ) {
        const walletId = req.account.walletId;
        const accountId = req.account.id;
        const balance = req.account.balance;

        if (Number(valorSacar) <= 0) {
          res.status(400).send({
            code: res.statusCode,
            msg: "Parametros invalidos",
          });
        }

        if (balance <= Number(valorSacar)) {
          res.status(400).send({
            code: res.statusCode,
            msg: "Saldo indisponivel",
          });
        } else {
          if (metodo.toLocaleLowerCase() == "banco") {
            const bancoNome = req.get("bancoNome");
            const agencia = req.get("agencia");
            const contaNumero = req.get("contaNumero");

            if (bancoNome && agencia && contaNumero) {
              const historicoWalletId = await createHistoricoWallet(
                Number(valorSacar),
                walletId,
                "saque"
              );

              if (historicoWalletId > 0) {
                const bancoSql: string = `
            insert into
                bank_account (
                    id,
                    bancoNome,
                    agencia,
                    contaNumero,
                    historicoWalletID,
                    accountID
                )
            values (
                    seq_bank_account.nextval,
                    :bancoNome,
                    :agencia,
                    :contaNumero,
                    :historicoWalletId,
                    :accountId
                )
          `;
                const result = await connection.execute(
                  bancoSql,
                  [
                    bancoNome,
                    agencia,
                    contaNumero,
                    historicoWalletId,
                    accountId,
                  ],
                  {
                    autoCommit: true,
                  }
                );

                const success = await withdrawFundsWallet(
                  walletId,
                  Number(valorSacar)
                );

                if (result && success) {
                  res.status(200).send({
                    code: res.statusCode,
                    msg: "Fundos retirados com sucesso!",
                  });
                }
              } else {
                res.status(400).send({
                  code: res.statusCode,
                  msg: "Não foi possivel retirar saldo",
                });
              }
            } else {
              res.status(400).send({
                code: res.statusCode,
                msg: "Parametros invalidos",
              });
            }
          } else if (metodo.toLocaleLowerCase() == "pix") {
            const chavePix = req.get("chavePix");

            if (chavePix) {
              const historicoWalletId = await createHistoricoWallet(
                Number(valorSacar),
                walletId,
                "saque"
              );

              if (historicoWalletId > 0) {
                const bancoSql: string = `
            insert into
                pix_account (
                    id,
                    pixKey,
                    historicoWalletID,
                    accountID
                )
            values (
                    seq_pix_account.nextval,
                    :pixKey,
                    :historicoWalletId,
                    :accountId
                )
          `;
                const result = await connection.execute(
                  bancoSql,
                  [chavePix, historicoWalletId, accountId],
                  {
                    autoCommit: true,
                  }
                );

                const success = await withdrawFundsWallet(
                  walletId,
                  Number(valorSacar)
                );

                if (result && success) {
                  res.status(200).send({
                    code: res.statusCode,
                    msg: "Fundos retirados com sucesso!",
                  });
                }
              } else {
                res.status(400).send({
                  code: res.statusCode,
                  msg: "Não foi possivel retirar saldo",
                });
              }
            } else {
              res.status(400).send({
                code: res.statusCode,
                msg: "Parametros invalidos",
              });
            }
          } else {
            res.status(500).send({
              code: res.statusCode,
              msg: "Erro ao retirar fundos.",
            });
          }
        }
      } else {
        res.status(400).send({
          code: res.statusCode,
          msg: "Parametros invalidos",
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

  /*
    Função para apostar em um evento
    Verifica se o user tem saldo suficiente
    caso tiver, o valor apostado é subtraido do saldo atual
    e aposta é registrada
   */
  async function betOnEvent(
    userId: number,
    eventoId: number,
    valorAposta: number,
    choice: number
  ): Promise<boolean> {
    let connection;

    try {
      connection = await OracleDB.getConnection(dbConfig);

      const sqlGetWallet = `
          SELECT ID, SALDO FROM WALLET WHERE USERID = :userId
        `;

      const result = (await connection.execute(sqlGetWallet, [userId]))
        .rows as [{ ID: number; SALDO: number }];

      if (result && result.length > 0) {
        const wallet = result[0];
        const saldoAtual = wallet.SALDO;

        if (!saldoAtual || saldoAtual < valorAposta) {
          console.error("Saldo insuficiente para realizar a aposta.");
          return false;
        }

        const sqlInsertBet = `
            INSERT INTO BETS (ID, VALOR, CHOICE, EVENTOID, ACCOUNTSID)
            VALUES (SEQ_ACCOUNTS.NEXTVAL, :valorAposta, :choice, :eventoId, :userId)
          `;
        const resultAposta = await connection.execute(
          sqlInsertBet,
          [valorAposta, choice, eventoId, userId],
          { autoCommit: false }
        );

        const sqlUpdateWallet = `
            UPDATE WALLET SET SALDO = SALDO - :valorAposta WHERE ID = :walletId
          `;
        await connection.execute(sqlUpdateWallet, [valorAposta, wallet.ID], {
          autoCommit: false,
        });

        if (resultAposta) {
          await connection.commit();
          return true;
        }
      }
    } catch (err) {
      console.error("Erro ao processar aposta:", err);
      if (connection) await connection.rollback();
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          console.error("Erro ao fechar conexão:", err);
        }
      }
    }

    return false;
  }

  /*
   Função para lidar com a requisição de aposta em evento
  */
  export const betOnEventHandler: RequestHandler = async (
    req: CustomRequest,
    res: Response
  ) => {
    const { eventoId, valorAposta, choice } = req.body;

    const account = req.account;

    if (
      account &&
      account.role != "moderador" &&
      account.balance &&
      account.walletId
    ) {
      const balance = account.balance;
      const walletId = account.walletId;

      if (eventoId && valorAposta && choice) {
        const choiceBool: number = choice.toLowerCase() == "sim" ? 1 : 0;

        if (balance <= Number(valorAposta)) {
          res.status(400).send({
            code: res.statusCode,
            msg: "Saldo indisponivel",
          });
        } else {
          const sucesso = await betOnEvent(
            account.id,
            eventoId,
            Number(valorAposta),
            choiceBool
          );

          if (sucesso) {
            const historicoWalletId = await createHistoricoWallet(
              valorAposta,
              walletId,
              "aposta"
            );
            res.status(200).send({
              code: res.statusCode,
              msg: "Aposta realizada com sucesso!",
              historicoWalletId: historicoWalletId,
            });
          } else {
            res.status(500).send({
              code: res.statusCode,
              msg: "Erro ao processar aposta",
            });
          }
        }
      } else {
        res
          .status(400)
          .send({ code: res.statusCode, msg: "Parâmetros inválidos" });
      }
    } else {
      res.status(401).send({
        code: res.statusCode,
        msg: "Usuário moderador não pode apostar",
      });
    }
  };

  /*
   Função para lidar com a requisição de historico wallet
  */
  export const hitoricoWalletHandler: RequestHandler = async (
    req: CustomRequest,
    res: Response
  ) => {
    let connection;

    try {
      connection = await OracleDB.getConnection(dbConfig);

      if (req.account && req.account.walletId) {
        const walletId = req.account.walletId;

        const parametro = req.get("parametro");

        var sql: string = `
      SELECT 
          ID as "id",
          DATATRANSFERENCIA AS "data",
          TIPOTRANSACAO AS "descricao",
          VALORADD AS "valor"
      FROM historico_wallet
      WHERE WALLETID = :walletId
      `;

        if (parametro && parametro.toString().trim() != "historico") {
          sql += `AND TIPOTRANSACAO = :parametro`;

          const result = (await connection.execute(sql, [walletId, parametro]))
            .rows as HistoricoWallet[];

          res.status(200).send({
            code: res.statusCode,
            walletId: walletId,
            msg: "Resultado do historico wallet",
            historico: result,
          });
        } else {
          const result = (await connection.execute(sql, [walletId]))
            .rows as HistoricoWallet[];

          res.status(200).send({
            code: res.statusCode,
            walletId: walletId,
            msg: "Resultado do historico wallet",
            historico: result,
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
}
