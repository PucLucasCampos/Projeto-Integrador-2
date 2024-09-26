import express from "express";
import { Router, Request, Response } from "express";

const app = express();
const route = Router();
const port = 3000;

app.use(express.json());

// ROTAS DE SERVIÇO
app.get('/', (req, res) => {
    res.send("Projeto Integrador - 2 semestre");
})

app.listen(port, () => {
    console.log(`Servidor Rodando na Porta: ${port}`)
})
