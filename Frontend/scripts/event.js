import { isModerador } from "./account.js";
import {
  fetchData,
  calculateTimeRemaining,
  cookieStorage,
} from "./utils/index.js";

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
  // const dataFim = new Date(event.dataFim).toLocaleDateString();

  const newCard = document.createElement("div", {
    class: "event-card",
  });

  newCard.innerHTML = `
            <div class="event-card">
                <div class="event-title">${event.titulo}</div>
                <div class="event-text">Apostas Realizadas: ${event.qtdApostas
                  .toString()
                  .padStart(2, "0")}</div>
            <div class="event-time">
            Encerrar Apostas: ${calculateTimeRemaining(event.dataFim)}
            </div>
                <button class="event-button">Apostar</button>
                ${
                  isModerador()
                    ? `<button class="event-button">Avaliar</button>`
                    : ""
                }
                
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
  e.preventDefault();

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

const createEvent = (e) => {
  e.preventDefault();

  const msgError = document.getElementById("erroCreateEvent");

  try {
    console.log("Criar Evento");
  } catch (error) {
    msgError.innerHTML = "Não foi possivel Criar Evento";
  } finally {
    setTimeout(() => {
      msgError.innerHTML = "";
    }, 1000);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const tabEnding = document.getElementById("nav-ending-tab");
  const tabPopular = document.getElementById("nav-popular-tab");
  const btnSearch = document.getElementById("search-button");
  const formCreateEvent = document.getElementById("createEvent");

  tabEnding &&
    tabEnding.addEventListener("click", () => {
      fetchEvents("awaiting approval");
      navTabActive = "card-ending";
    });

  tabPopular &&
    tabPopular.addEventListener("click", () => {
      fetchEvents("mostBet");
      navTabActive = "card-popular";
    });

  btnSearch && btnSearch.addEventListener("click", searchEvent);

  formCreateEvent.addEventListener("submit", createEvent);
});

fetchEvents("awaiting approval");
