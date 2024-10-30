create table wallet(
    ID INTEGER NOT NULL PRIMARY KEY,
    userId integer,
    saldo INTEGER DEFAULT 0,
    FOREIGN KEY (userId) REFERENCES ACCOUNTS(ID)
);

create table historico_wallet(
    ID INTEGER NOT NULL PRIMARY KEY,
    valorAdd INTEGER DEFAULT 0,
    data_transferencia date,
    walletId integer,
    tipo varchar2(8),
    FOREIGN KEY (walletId) REFERENCES wallet(ID)
)
