import { cookieStorage, fetchData } from "./utils/index.js";

const { setCookie, getCookie } = cookieStorage();

const token = "DTCGM3KGRIZU1D14FWWX40IB92S0S6HPHQ9DKU2Z8JAP43UCLD8KU24NV5GEA269";

setCookie("token", token);

// Buscar dados do usuário e atualizar na página
const account = async () => {
   try {
      const data = await fetchData("/getAccount", getCookie("token"), "GET");

      const usuario = data.usuarios;

      document.getElementById("nome-user").innerHTML = `${usuario.name}`;
      document.getElementById("saldo-user").innerHTML = `${usuario.balance.toLocaleString(
         "pt-BR",
         {
            style: "currency",
            currency: "BRL",
         }
      )}`;
   } catch (error) {
      console.error("Erro ao buscar dados:", error);
   }
};

// account();

const signUp = async (e) => {
   e.preventDefault();

   try {
      const name = document.getElementById("name").value;
      const birthday = document.getElementById("birthday").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      if (name && birthday && email && password) {
         const data = await fetchData("/signUp", "", "PUT", {
            name: name,
            email: email,
            password: password,
            birthday: birthday,
            role: "user",
         });

         if (data.code == 209) {
            window.alert(data.msg);
            return;
         }

         window.location.href = "home.html";
      }else{
        window.alert("Requisição inválida - Parâmetros faltando.");
      }
   } catch (error) {
      console.error(error);
   }
};

document.getElementById("btnCadastro").addEventListener("click", signUp);
