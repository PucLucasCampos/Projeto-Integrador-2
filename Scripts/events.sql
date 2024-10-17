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
    status
) VALUES (
    SEQ_EVENTS.NEXTVAL,
    'Titulo 01',
    'Descrição 01',
    0,
    TO_DATE('2024-10-16', 'YYYY-MM-DD'),
    TO_DATE('2024-10-20', 'YYYY-MM-DD'),
    TO_DATE('2024-10-15', 'YYYY-MM-DD'),
    0
);

COMMIT;