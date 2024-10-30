import express from "express";
import { Request, Response, Router } from "express";
import { AccountsHandler } from "./accounts/accounts";
import { EventHandler } from "./events/events";
import dotenv from "dotenv";
dotenv.config();

const port = 3000;
const server = express();
const routes = Router();

routes.use(express.json());
routes.use(express.urlencoded({ extended: true }));

// definir as rotas.
// a rota tem um verbo/método http (GET, POST, PUT, DELETE)
routes.get("/", (req: Request, res: Response) => {
   res.statusCode = 403;
   res.send("Acesso não permitido.");
});

routes.put(
   "/signUp",
   AccountsHandler.verifyToken,
   AccountsHandler.putCreateAccountsRoute
);

routes.post("/login", AccountsHandler.loginHandler);

routes.get(
   "/getAccounts",
   AccountsHandler.verifyToken,
   AccountsHandler.getAllAccountsRoute
);
routes.get("/getAccount", AccountsHandler.verifyToken, AccountsHandler.getAccountRoute);

routes.post("/addNewEvent", AccountsHandler.verifyToken, EventHandler.postAddEventRoute);

routes.get("/getEvents", EventHandler.getAllEvents);

routes.delete("/deleteEvent", AccountsHandler.verifyToken, EventHandler.deleteEvent);

routes.post(
   "/evaluateNewEvent",
   AccountsHandler.verifyToken,
   EventHandler.evaluateNewEvent
);

routes.post("/finishEvent", 
  AccountsHandler.verifyToken, 
  EventHandler.finishEvent
);

server.use(routes);

server.listen(port, () => {
   console.log(`Server is running on: ${port}`);
});
