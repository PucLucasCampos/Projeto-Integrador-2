import express from "express";
import { Request, Response, Router } from "express";
import { AccountsHandler } from "./accounts/accounts";
import { EventHandler } from "./events/events";
import dotenv from "dotenv";
dotenv.config();

const port = 3000;
const server = express();
const routes = Router();

routes.use(express.json())
routes.use(express.urlencoded({ extended: true })) 

// definir as rotas.
// a rota tem um verbo/método http (GET, POST, PUT, DELETE)
routes.get("/", (req: Request, res: Response) => {
  res.statusCode = 403;
  res.send("Acesso não permitido.");
});

routes.put("/signUp", AccountsHandler.putCreateAccountsRoute);

routes.post("/login", AccountsHandler.loginHandler);

routes.get("/getAccounts", AccountsHandler.getAllAccountsRoute);

routes.post('/addNewEvent', EventHandler.postAddEventRoute)

routes.get("/getEvents", EventHandler.getAllEvents);

server.use(routes);

server.listen(port, () => {
  console.log(`Server is running on: ${port}`);
});
