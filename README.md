# Projeto Integrador 2
Plataforma web de apostas em eventos futuros


# CURL

## PUT signUp
```
curl --location --request PUT 'http://localhost:3000/signUp' --header 'name: luis' --header 'email: admin01@gmail.com' --header 'password: 123' --header 'birthday: 2024/11/17'
```

## GET Accounts
```
curl --location --request GET 'http://localhost:3000/getAccounts'
```

## POST login
```
curl --location --request POST 'http://localhost:3000/login' --header 'email: admin@gmail.com' --header 'password: 123'
```

## POST addNewEvent

curl -X POST http://localhost:3000/addNewEvent \
-H "Content-Type: application/json" \
-d '{
    "titulo": "Titulo 01",
    "descricao": "Descrição 01",
    "valorCota": 0,
    "dataInicio": "2024-10-16",
    "dataFim": "2024-10-20",
    "dataCriacao": "2024-10-15"
}'
