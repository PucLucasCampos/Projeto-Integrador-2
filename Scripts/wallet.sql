create table wallet(
    ID INTEGER NOT NULL PRIMARY KEY,
    userId integer,
    saldo INTEGER DEFAULT 0,
    FOREIGN KEY (userId) REFERENCES ACCOUNTS(ID)
)
