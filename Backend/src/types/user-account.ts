/**
 * Tipo UserAccount
 */
export type UserAccount = {
  id: number;
  name: string;
  email: string;
  password?: string;
  birthday: string;
  token?: string
};
