create table wallet (
    ID INTEGER NOT NULL PRIMARY KEY,
    userId integer,
    saldo FLOAT DEFAULT 0,
    FOREIGN KEY (userId) REFERENCES ACCOUNTS (ID)
);

create sequence seq_historico_wallet start with 1 increment by 1;

CREATE TABLE historico_wallet (
    ID INTEGER NOT NULL PRIMARY KEY,
    valorAdd INTEGER DEFAULT 0,
    dataTransferencia DATE DEFAULT CURRENT_DATE,
    walletId INTEGER,
    tipoTransacao VARCHAR2 (8) CHECK (
        tipoTransacao IN ('saque', 'deposito', 'aposta')
    ),
    FOREIGN KEY (walletId) REFERENCES wallet (ID)
);

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
        100,
        1,
        'saque'
    )
RETURNING
    ID INTO:id;

create sequence seq_bank_account start with 1 increment by 1;

create table bank_account (
    id INTEGER NOT NULL PRIMARY KEY,
    bancoNome VARCHAR2(100),
    agencia INTEGER NOT NULL,
    contaNumero INTEGER NOT NULL,
    dataTransferencia DATE DEFAULT CURRENT_DATE,
    historicoWalletID INTEGER NOT NULL,
    accountID INTEGER NOT NULL,


    FOREIGN KEY (historicoWalletID) REFERENCES HISTORICO_WALLET(ID),
    FOREIGN KEY (accountID) REFERENCES ACCOUNTS(ID)
);

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
        'Brandesco',
        215,
        6654,
        1,
        83
    );


create sequence seq_pix_account start with 1 increment by 1;

create table pix_account (
    id INTEGER NOT NULL,
    pixKey VARCHAR2(150),
    dataTransferencia DATE DEFAULT CURRENT_DATE,
    historicoWalletID INTEGER NOT NULL,
    accountID INTEGER NOT NULL,


    FOREIGN KEY (historicoWalletID) REFERENCES HISTORICO_WALLET(ID),
    FOREIGN KEY (accountID) REFERENCES ACCOUNTS(ID)
);