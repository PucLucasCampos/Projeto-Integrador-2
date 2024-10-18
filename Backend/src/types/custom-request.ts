import { Request } from "express";
import { AccountsHandler } from "../accounts/accounts";

export interface CustomRequest extends Request {
    token?: string;
    account?: AccountsHandler.UserAccount
  }
  
  