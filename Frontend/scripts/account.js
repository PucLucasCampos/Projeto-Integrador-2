import { cookieStorage, fetchData } from "./utils/index.js";

const { setCookie, getCookie } = cookieStorage();

var navTabActive = "tbody-historic"; // "tbody-historic" | "tbody-deposits" | "tbody-bets" | "tbody-withdraw"

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
              chavePix: chavePix.value,
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

/**
 * Limpar tabela de historico para mostrar todos os historico atualizados
 * @param {array} historico
 */
export const showHistory = async (historico) => {
  const historicBody = document.getElementById(navTabActive);
  historicBody.innerHTML = "";

  if (historico) {
    historico.map((item) => {
      createRowHistoric(item);
    });
  }
};

// Mapeamento da descrição historico
const rowDescricaoHistoric = {
  saque: "Saque Realizado",
  deposito: "Crédito Adicionado",
  aposta: "Aposta Realizada",
};

/**
 * Criar row do historico para aparecer na tela
 * @param {object} historico
 */
const createRowHistoric = (historico) => {
  const newRow = document.createElement("tr");

  const data = new Date(historico.data).toLocaleDateString();

  newRow.innerHTML = `
            <td>${data}</td>
            <td>${rowDescricaoHistoric[historico.descricao]}</td>
            ${
              historico.descricao == "deposito"
                ? `<td class="text-success">${historico.valor.toLocaleString(
                    "pt-BR",
                    {
                      style: "currency",
                      currency: "BRL",
                    }
                  )}</td>`
                : `<td class="text-danger">${historico.valor.toLocaleString(
                    "pt-BR",
                    {
                      style: "currency",
                      currency: "BRL",
                    }
                  )}</td>`
            }
     
    `;

  document.querySelector(`#${navTabActive}`).appendChild(newRow);
};

const fetchHistoryWallet = async (tipoTransacao) => {

  console.log(tipoTransacao);

  try {
    const data = await fetchData("/historyWallet", getCookie("token"), "GET", {
      parametro: tipoTransacao,
    });

    console.log(data, tipoTransacao);

    showHistory(data.historico);
  } catch (error) {
    console.error("Erro ao buscar dados: ", error);
  }
};

const history = async () => {
  const pillsHistoric = document.getElementById("pills-historic-tab");
  const pillsDeposits = document.getElementById("pills-deposits-tab");
  const pillsBets = document.getElementById("pills-bets-tab");
  const pillsWithdraw = document.getElementById("pills-withdraw-tab");

  pillsHistoric &&
    pillsHistoric.addEventListener("click", () => {
      fetchHistoryWallet("historico");
      navTabActive = "tbody-historic";
    });
  pillsDeposits &&
    pillsDeposits.addEventListener("click", () => {
      fetchHistoryWallet("deposito");
      navTabActive = "tbody-deposits";
    });
  pillsBets &&
    pillsBets.addEventListener("click", () => {
      fetchHistoryWallet("aposta");
      navTabActive = "tbody-bets";
    });
  pillsWithdraw &&
    pillsWithdraw.addEventListener("click", () => {
      fetchHistoryWallet("saque");
      navTabActive = "tbody-withdraw";
    });

  fetchHistoryWallet("historico");
};

document.addEventListener("DOMContentLoaded", () => {
  const btnCadastro = document.getElementById("btnCadastro");
  const btnLogin = document.getElementById("btnLogin");
  const modalAddFounds = document.getElementById("addFounds");
  const modalWithdrawFunds = document.getElementById("withdrawFunds");
  const tableHistory = document.getElementById("pills-tabContent");

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

  if (tableHistory) history();
});

account();
