import { cookieStorage, fetchData } from "./utils/index.js";

const { setCookie, getCookie } = cookieStorage();

const token =
  "DTCGM3KGRIZU1D14FWWX40IB92S0S6HPHQ9DKU2Z8JAP43UCLD8KU24NV5GEA269";

setCookie("token", token);

// Buscar dados do usuário e atualizar na página
export const account = async () => {
  try {
    const data = await fetchData("/getAccount", getCookie("token"), "GET");

    const usuario = data.usuarios;

    document.getElementById("nome-user").innerHTML = `${usuario.name}`;
    document.getElementById(
      "saldo-user"
    ).innerHTML = `${usuario.balance.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })}`;
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
  }
};

account()