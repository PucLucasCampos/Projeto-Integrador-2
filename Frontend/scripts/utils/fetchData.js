
/**
 * Realizar requisições ao backend
 * 
 * Necessario passar cada parametro seguindo sua sequência.
 * Padrão de requisição GET.
 * 
 * Se tiver token ne passar em formato string senão string vaiza ""
 * 
 * @param {string} endpoint 
 * @param {string} token 
 * @param {string} method "GET" | "POST" | "PATCH" | "PUT"
 * @param {object} header se tiver passar o objeto do header senão objeto vazio {}
 * @param {object} body se tiver passar o objeto do body senão objeto vazio {}
 * @returns response ou erro
 * 
 * @example 
 * 
 * exemplo 01:
 * Requisição GET com token, sem header, sem body
 * const response = fetchData("/endpoint", "token");
 * 
 * exemplo 02:
 * Requisição GET sem token, sem header, sem body
 * const response = fetchData("/endpoint");
 * 
 * exemplo 03:
 * Requisição POST com token, sem header, com body
 * const response = fetchData("/endpoint", "token", "POST", {}, {parametro: "valor"});
 * 
 * exemplo 04:
 * Requisição PUT com token, com header, sem body
 * const response = fetchData("/endpoint", "token", "PUT", {parametro: "valor"});
 */
export const fetchData = async (endpoint, token, method, header, body) => {
  try {
    const response = await fetch(`http://localhost:3000${endpoint}`, {
      method: method ? method : "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...header,
      },
      body
    });

    if(response.status === 422){
      throw new Error("Usuario menor de 18!");
    }

    if (!response.ok) {
      throw new Error("Falhou a requisição");
    }

    if (response.status === 404) {
      throw new Error("Não encontrou qualquer resultado");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro:", error);
    throw error;
  }
};
