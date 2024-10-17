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

INSERT INTO ACCOUNTS (ID, EMAIL, PASSWORD, COMPLETE_NAME, TOKEN) VALUES
(
    SEQ_ACCOUNTS.NEXTVAL,
    'luis@puccampinas.edu.br',
    'luis',
    'Luis Silva',
    dbms_random.string('x',64)
);

COMMIT;

SELECT * FROM ACCOUNTS;

DROP TABLE ACCOUNTS;

SELECT TOKEN FROM ACCOUNTS WHERE email = 'luis@puccampinas.edu.br' AND password = 'luis';

