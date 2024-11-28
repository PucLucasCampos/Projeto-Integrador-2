import { isModerador } from "./account.js";
import { formatDateForOracle } from "./utils/formatDateForOracle.js";
import {
  fetchData,
  calculateTimeRemaining,
  cookieStorage,
} from "./utils/index.js";

const { getCookie } = cookieStorage();

// Variavel aux para saber em qual tab o usuario esta acessando
var navTabActive = "card-ending"; // "card-ending" | "card-popular" | "card-category"

/**
 * Limpar div de eventos para mostrar todos os eventos atualizados
 * @param {array} events
 */
export const showEvents = async (events) => {
  const eventGrid = document.getElementById(navTabActive);
  eventGrid.innerHTML = "";

  if (events) {
    events.map((event) => {
      createCardEvent(event);
    });
  }
};

/**
 * Limpar div de Categoria para mostrar todos os Categorias atualizados
 * @param {array} events
 */
export const showCategory = async (category) => {
  const categoryGrid = document.getElementById(navTabActive);
  categoryGrid.innerHTML = "";

  if (category) {
    category.map((item) => {
      createCardCategory(item);
    });
  }
};

/**
 * Criar card do evento para aparecer na tela
 * @param {object} event
 */
const createCardEvent = (event) => {
  // const dataFim = new Date(event.dataFim).toLocaleDateString();

  const newCard = document.createElement("div", {
    class: "event-card",
  });

  newCard.innerHTML = `
            <div class="event-card" id='${event.id}'>
                <div class="event-title">${event.titulo}</div>
                <div class="event-text">Apostas Realizadas: ${event.qtdApostas
                  .toString()
                  .padStart(2, "0")}</div>
            <div class="event-time">
            Encerrar Apostas: ${calculateTimeRemaining(event.dataFim)}
            </div>
             <div class="event-status">
           Status: ${event.status}
            </div>
            ${
              event.status == "approved"
                ? `<button class="event-button" data-event-id="${event.id}" data-bs-toggle="modal" data-bs-target="#betModal">Apostar</button>`
                : ""
            }
                ${
                  isModerador()
                    ? `<button class="avaliar-button" data-event-id="${event.id}" data-bs-toggle="modal" data-bs-target="#evaluateModal">Avaliar</button>`
                    : ""
                }
              </div>
    `;

  document.querySelector(`#${navTabActive}`).appendChild(newCard);
};

/**
 * Criar card de categoria para aparecer na tela
 * @param {object} categoria
 */
const createCardCategory = (category) => {
  const newCard = document.createElement("a");

  newCard.href = `categoria.html?category=${category.id}`;

  newCard.innerHTML = `
    <div class="category-card">
      <div class="category-icon">🏅</div>
      <div class="text-b">${category.nome}</div>
      <div class="category-count">${category.qtdEventos
        .toString()
        .padStart(2, "0")} eventos</div>
    </div>
    `;

  document.querySelector(`#${navTabActive}`).appendChild(newCard);
};

const fetchEventsTab = {
  "card-ending": "ending",
  "card-popular": "popular",
};

/**
 * Buscar todos os eventos de acordo com o status dele no backend
 * @param {string} status "awaiting approval" | "closed"...
 */
export const fetchEvents = async (status) => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const categoria = urlParams.get("category");

    const params = {
      parametro: status ? status : fetchEventsTab[navTabActive],
    };

    Object.assign(params, categoria && { categoria });

    const data = await fetchData("/getEvents", "", "GET", params);

    showEvents(data.events);
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

/**
 * Buscar todas categorias
 */
export const fetchCategory = async () => {
  try {
    const data = await fetchData("/getCategory", "", "GET");

    showCategory(data.categoria);
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
  }
};

const createEvent = async (e) => {
  e.preventDefault();

  const msgError = document.getElementById("erroCreateEvent");

  try {
    const titulo = document.getElementById("titleEvent");
    const descricao = document.getElementById("descriptionEvent");
    const dataInicio = document.getElementById("dateStartEvent");
    const dataFim = document.getElementById("dateEndEvent");
    const categoria = document.getElementById("categoriaEvent");

    if (!titulo.value.trim() || !descricao.value.trim()) {
      msgError.innerHTML = "Título e descrição são obrigatórios.";
      return;
    }

    if (
      isNaN(Date.parse(dataInicio.value)) ||
      isNaN(Date.parse(dataFim.value))
    ) {
      msgError.innerHTML = "Datas inválidas.";
      return;
    }

    const data = await fetchData(
      "/addNewEvent",
      getCookie("token"),
      "POST",
      {},
      {
        titulo: titulo.value,
        descricao: descricao.value,
        dataInicio: dataInicio.value,
        dataFim: dataFim.value,
        categoriaId: categoria.value,
      }
    );

    if (data.code == 200) {
      fetchEvents();
      titulo.value = "";
      descricao.value = "";
      dataInicio.value = "";
      dataFim.value = "";
    }

    msgError.innerHTML = data.msg;
  } catch (error) {
    msgError.innerHTML = "Não foi possivel Criar Evento";
  } finally {
    setTimeout(() => {
      msgError.innerHTML = "";
    }, 1000);
  }
};

export const fetchSelectCategory = async () => {
  const selectCategoryContent = document.getElementById("categoriaEvent");
  selectCategoryContent.innerHTML = "";

  const data = await fetchData("/getCategory", "", "GET");
  const dataCategoria = data.categoria;

  dataCategoria.map((item) => {
    const newOption = document.createElement("option");
    newOption.value = item.id;
    newOption.textContent = item.nome;
    document.querySelector(`#categoriaEvent`).appendChild(newOption);
  });
};

export const evalueteNewEvent = async (eventId) => {
  const msgError = document.getElementById("errorAvaliateEvent");

  try {
    if (document.getElementById("approveOption").checked) {
      const data = await fetchData(
        "/evaluateNewEvent",
        getCookie("token"),
        "POST",
        {
          id: eventId,
          avaliar: "aprovado",
        }
      );

      if (data.code == 200) {
        fetchEvents();
      }

      msgError.innerHTML = data.msg;
    } else {
      const data = await fetchData(
        "/evaluateNewEvent",
        getCookie("token"),
        "POST",
        {
          id: eventId,
          avaliar: "reprovado",
        }
      );

      if (data.code == 200) {
        fetchEvents();
      }

      msgError.innerHTML = data.msg;
    }
  } catch (error) {
    msgError.innerHTML = "Não foi possivel Avaliar Evento";
  } finally {
    setTimeout(() => {
      msgError.innerHTML = "";
    }, 1000);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const tabEnding = document.getElementById("nav-ending-tab");
  const tabPopular = document.getElementById("nav-popular-tab");
  const tabCategory = document.getElementById("nav-category-tab");
  const btnSearch = document.getElementById("search-button");
  const formCreateEvent = document.getElementById("createEvent");

  tabEnding &&
    tabEnding.addEventListener("click", () => {
      navTabActive = "card-ending";
      fetchEvents();
    });

  tabPopular &&
    tabPopular.addEventListener("click", () => {
      navTabActive = "card-popular";
      fetchEvents();
    });

  tabCategory &&
    tabCategory.addEventListener("click", () => {
      navTabActive = "card-category";
      fetchCategory();
    });

  btnSearch && btnSearch.addEventListener("click", searchEvent);

  formCreateEvent && formCreateEvent.addEventListener("submit", createEvent);

  const urlParams = new URLSearchParams(window.location.search);
  const categoria = urlParams.get("category");

  if (categoria) {
    navTabActive = "card-category";
  }
});

fetchEvents();
