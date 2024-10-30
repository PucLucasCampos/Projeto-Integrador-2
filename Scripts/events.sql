CREATE TABLE EVENTS (
    ID INTEGER NOT NULL PRIMARY KEY,
    titulo VARCHAR2 (100) NOT NULL,
    descricao VARCHAR2 (250) NOT NULL,
    valorCota INTEGER DEFAULT 0,
    dataInicio DATE NOT NULL,
    dataFim DATE NOT NULL,
    dataCriacao DATE NOT NULL,
    status NUMBER (1),
    accountsID INTEGER,
    FOREIGN KEY (accountsID) REFERENCES ACCOUNTS(ID)
);

CREATE SEQUENCE SEQ_EVENTS START WITH 1 INCREMENT BY 1;

SELECT * FROM EVENTS;

INSERT INTO EVENTS 
(
    id,
    titulo,
    descricao,
    valorCota,
    dataInicio,
    dataFim,
    dataCriacao,
    status,
    accountsID
) VALUES (
    SEQ_EVENTS.NEXTVAL,
    'Titulo 01',
    'Descrição 01',
    0,
    TO_DATE('2024-10-16', 'YYYY-MM-DD'),
    TO_DATE('2024-10-20', 'YYYY-MM-DD'),
    TO_DATE('2024-10-15', 'YYYY-MM-DD'),
    'awaiting approval',
    83
);

COMMIT;

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
    B.ID AS "betId",
    COALESCE(SUM(B.VALOR), 0) AS "valorApostado"
FROM EVENTS E
    JOIN ACCOUNTS A ON A.ID = E.ACCOUNTSID
    LEFT JOIN BETS B ON B.ID = E.ID
WHERE 
    E.STATUS = 'deleted'
GROUP BY 
    E.ID, E.TITULO, E.DESCRICAO, E.VALORCOTA, E.DATAINICIO, E.DATAFIM, E.STATUS,
    A.ID, A.NAME, A.EMAIL, B.ID;

