CREATE TABLE ACCOUNTS (
    ID INTEGER NOT NULL PRIMARY KEY,
    EMAIL VARCHAR2(100) NOT NULL UNIQUE,
    NAME VARCHAR2(100) NOT NULL,
    BIRTHDAY DATE NOT NULL,
    PASSWORD VARCHAR2(32) NOT NULL,
    TOKEN VARCHAR2(64) NOT NULL
);

CREATE SEQUENCE SEQ_ACCOUNTS START WITH 1 
INCREMENT BY 1;

set serveroutput on
begin
  for i in 1 .. 5 loop
    dbms_output.put_line('string(''x'',10)= ' || dbms_random.string('x',64));
  end loop;
end;

INSERT INTO ACCOUNTS (ID, EMAIL, NAME, BIRTHDAY, PASSWORD, TOKEN) VALUES
(
    SEQ_ACCOUNTS.NEXTVAL,
    'luis@puccampinas.edu.br',
    'luis',
    TO_DATE('2005-02-10', 'YYYY-MM-DD'),
    '1234',
    dbms_random.string('x',64)
);    
    
COMMIT;

SELECT * FROM ACCOUNTS;

DROP TABLE ACCOUNTS;

SELECT TOKEN FROM ACCOUNTS WHERE email = 'luis@puccampinas.edu.br' AND password = 'luis';

SELECT 
    A.ID AS accountID, 
    A.EMAIL, 
    A.NAME, 
    A.BIRTHDAY, 
    B.ID AS betID, 
    B.valor AS betValue, 
    E.ID AS eventID, 
    E.titulo AS eventTitle, 
    E.descricao AS eventDescription, 
    E.valorCota, 
    E.dataInicio, 
    E.dataFim, 
    E.dataCriacao, 
    E.status
FROM 
    ACCOUNTS A
LEFT JOIN 
    BETS B ON A.ID = B.accountsID
LEFT JOIN 
    EVENTS E ON B.eventoID = E.ID
WHERE 
    E.status = 'awaiting approval';
