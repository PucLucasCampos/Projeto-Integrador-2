import {
  fetchData,
  calculateTimeRemaining,
  cookieStorage,
} from "./utils/index.js";

const { getCookie } = cookieStorage();

var navTabActive = "card-events";

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
          </div>
    `;

  document.querySelector(`#${navTabActive}`).appendChild(newCard);
};

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

const searchEvent = async () => {
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

export const showEvents = async (events) => {
  const eventGrid = document.getElementById(navTabActive);
  eventGrid.innerHTML = "";

  if (events) {
    events.map((event) => {
      createCard(event);
    });
  }
};

document.getElementById("nav-events-tab").addEventListener("click", () => {
  fetchEvents("awaiting approval");
  navTabActive = "card-events";
});

document.getElementById("nav-apostado-tab").addEventListener("click", () => {
  fetchEvents("mostBet");
  navTabActive = "card-apostado";
});

document.getElementById("search-button").addEventListener("click", searchEvent);
