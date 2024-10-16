# Projeto Integrador 2
Plataforma web de apostas em eventos futuros


# CURL

## PUT SignUp
```
curl --location --request PUT 'http://localhost:3000/signUp' --header 'name: luis' --header 'email: admin01@gmail.com' --header 'password: 123' --header 'birthdate: 17/11/2004'
```

## GET Accounts
```
curl --location --request GET 'http://localhost:3000/get/accounts'
```

## POST login
```
curl --location --request POST 'http://localhost:3000/login' --header 'email: admin@gmail.com' --header 'password: 123'
```