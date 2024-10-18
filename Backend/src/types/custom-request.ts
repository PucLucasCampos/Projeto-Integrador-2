import { Request } from "express";
import { UserAccount } from "./user-account";

export interface CustomRequest extends Request {
    token?: string;
    account?: UserAccount
  }
  
  