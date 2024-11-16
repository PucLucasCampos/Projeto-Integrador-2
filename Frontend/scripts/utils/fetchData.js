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
