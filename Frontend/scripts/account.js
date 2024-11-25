import { cookieStorage, fetchData } from "./utils/index.js";

const { setCookie, getCookie } = cookieStorage();

// Buscar dados do usuário e atualizar na página
const account = async () => {
  try {
    if (getCookie("token")) {
      const data = await fetchData("/getAccount", getCookie("token"), "GET");

      const usuario = data.usuarios;

      localStorage.setItem("usuario", JSON.stringify(usuario));

      document.getElementById("nome-user").innerHTML = `${usuario.name}`;
      const elementsBalance = document.querySelectorAll(".balance");
      elementsBalance.forEach((elemento) => {
        elemento.textContent = `${usuario.balance.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}`;
      });
    }
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
  }
};

export function isModerador() {
  const account = JSON.parse(localStorage.getItem("usuario"));

  return account.role == "moderador" ? true : false;
}

const addFounds = async (e) => {
  e.preventDefault();

  const msgError = document.getElementById("erroAdicionarCredito");
  const valorCredito = document.getElementById("valorCredito");

  try {
    const valor = parseFloat(valorCredito.value);

    if (isNaN(valor) || valor <= 0) {
      msgError.innerHTML = `Valor inválido`;
    } else {
      const response = await fetchData("/addFunds", getCookie("token"), "PUT", {
        valorAdd: valorCredito.value,
      });

      if (response.code == 200) account();

      msgError.innerHTML = response.msg;
    }
  } catch (error) {
    msgError.innerHTML = `Não foi possivel adicionar fundos`;
    console.error("Não foi possivel enviar fundos", error);
  } finally {
    valorCredito.value = "0";

    setTimeout(() => {
      msgError.innerHTML = "";
    }, 1000);
  }
};

const withdrawFunds = async (e) => {
  e.preventDefault();

  const msgError = document.getElementById("erroSaque");
  const valorSaque = document.getElementById("valorSaque");

  try {
    const valor = parseFloat(valorSaque.value);

    if (isNaN(valor) || valor <= 0) {
      msgError.innerHTML = `Valor inválido`;
    } else {
      if (document.getElementById("metodoPix").checked) {
        const chavePix = document.getElementById("chavePix");

        if (chavePix.value) {
          const response = await fetchData(
            "/withdrawFunds",
            getCookie("token"),
            "PUT",
            {
              valorSacar: valor,
              metodo: "pix",
              chavePix: chavePix.value
            }
          );

          if (response.code == 200) {
            account();
            chavePix.value = "0";
          }

          msgError.innerHTML = response.msg;
        } else {
          msgError.innerHTML = "Parametros invalidos";
        }
      } else {
        const bancoNome = document.getElementById("bancoNome");
        const agencia = document.getElementById("agencia");
        const contaNumero = document.getElementById("contaNumero");

        if (bancoNome.value && agencia.value && contaNumero.value) {
          const response = await fetchData(
            "/withdrawFunds",
            getCookie("token"),
            "PUT",
            {
              valorSacar: valor,
              metodo: "banco",
              bancoNome: bancoNome.value,
              agencia: agencia.value,
              contaNumero: contaNumero.value,
            }
          );

          if (response.code == 200) {
            account();
            bancoNome.value = "";
            agencia.value = "0";
            contaNumero.value = "0";
          }

          msgError.innerHTML = response.msg;
        } else {
          msgError.innerHTML = "Parametros invalidos";
        }
      }
    }
  } catch (error) {
    msgError.innerHTML = `Não foi possivel retirar fundos`;
    console.error("Não foi possivel retirar fundos", error);
  } finally {
    valorSaque.value = "0";

    setTimeout(() => {
      msgError.innerHTML = "";
    }, 1000);
  }
};

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
    } else {
      window.alert("Requisição inválida - Parâmetros faltando.");
    }
  } catch (error) {
    console.error(error);
  }
};

const login = async (e) => {
  e.preventDefault();

  const password = document.getElementById("password").value;
  const email = document.getElementById("email").value;

  console.log({
    email: email,
    password: password,
  });

  try {
    if (email && password) {
      const data = await fetchData("/login", "", "POST", {
        email: email,
        password: password,
      });

      if (data.code == 401) {
        window.alert(data.msg);
        return;
      }

      setCookie("token", data.token);

      console.log(data);
      window.location.href = "home.html";
    } else {
      window.alert("Senha ou email invalidos");
    }
  } catch (error) {
    console.error(error);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const btnCadastro = document.getElementById("btnCadastro");
  const btnLogin = document.getElementById("btnLogin");
  const modalAddFounds = document.getElementById("addFounds");
  const modalWithdrawFunds = document.getElementById("withdrawFunds");

  if (btnCadastro) {
    btnCadastro.addEventListener("click", signUp);
  }

  if (btnLogin) {
    btnLogin.addEventListener("click", login);
  }

  if (modalAddFounds) {
    modalAddFounds.addEventListener("submit", addFounds);
  }

  if (modalWithdrawFunds) {
    modalWithdrawFunds.addEventListener("submit", withdrawFunds);
  }
});

account();
