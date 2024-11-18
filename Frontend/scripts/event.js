import {
  fetchData,
  calculateTimeRemaining,
  cookieStorage,
} from "./utils/index.js";
import {account} from "./account.js"

const { getCookie } = cookieStorage();

// Variavel aux para saber em qual tab o usuario esta acessando
var navTabActive = "card-ending"; // "card-ending" | "card-popular"

/**
 * Limpar div de eventos para mostrar todos os eventos atualizados
 * @param {array} events 
 */
export const showEvents = async (events) => {
  const eventGrid = document.getElementById(navTabActive);
  eventGrid.innerHTML = "";

  if (events) {
    events.map((event) => {
      createCard(event);
    });
  }
};

/**
 * Criar card do evento para aparecer na tela
 * @param {object} event 
 */
const createCard = (event) => {
  const dataFim = new Date(event.dataFim).toLocaleDateString();

  const newCard = document.createElement("div", {
    class: "event-card",
  });

  newCard.innerHTML = `
          <div class="event-card">
            <div class="event-time">
            TEMPO PARA ENCERRAR A APOSTA
            ${calculateTimeRemaining(event.dataFim)} ${dataFim}
            </div>
            <div class="event-title">Titulo: ${event.titulo}</div>
            <div class="event-stats">Quantidade de aposta: ${event.qtdApostas
              .toString()
              .padStart(2, "0")}</div>
              <button class="event-button">Apostar</button>
          </div>
    `;

  document.querySelector(`#${navTabActive}`).appendChild(newCard);
};

/**
 * Buscar todos os eventos de acordo com o status dele no backend
 * @param {string} status "awaiting approval" | "closed"...
 */
export const fetchEvents = async (status) => {
  try {
    var parametroAux = "";

    if (status != "mostBet") {
      parametroAux = status;
    }

    const data = await fetchData("/getEvents", "", "GET", {
      parametro: parametroAux,
    });

    console.log(data)

    if (status === "mostBet") {
      const mostEventsBet = data.events.filter((item) => item.qtdApostas > 0);

      showEvents(mostEventsBet);
    } else {
      showEvents(data.events);
    }
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
  }
};

/**
 * Barra de pesquisa buscar evento pelo TITULO | DESCRIÇÃO...
 * @param {*} e 
 */
const searchEvent = async (e) => {
  e.preventDefault()

  try {
    const search = document.getElementById("search-input").value;

    const data = await fetchData(
      `/searchEvent?search=${search}`,
      getCookie("token"),
      "PUT"
    );

    showEvents(data.events);
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
  }
};

// Quando o usuario clicar no botão com o id "nav-ending-tab" buscar todos os evento do status "awaiting approval" e atualiza variavel aux
document.getElementById("nav-ending-tab").addEventListener("click", () => {
  fetchEvents("awaiting approval");
  navTabActive = "card-ending";
});

// Quando o usuario clicar no botão com o id "nav-popular-tab" buscar todos os evento do status "mostBet" e atualiza variavel aux
document.getElementById("nav-popular-tab").addEventListener("click", () => {
  fetchEvents("mostBet");
  navTabActive = "card-popular";
});

// Quando o usuario clicar no botão de pesquisar evento realizar a função de pesquisa
document.getElementById("search-button").addEventListener("click", searchEvent);

fetchEvents("awaiting approval");
account();