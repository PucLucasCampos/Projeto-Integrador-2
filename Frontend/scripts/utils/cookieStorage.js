
/**
 * Função base para armazenar algum valor no cookie do chrome
 * @example 
 * const { setCookie, getCookie, 
 * deleteCookie, deleteAllCookies } = cookieStorage();
 * @returns funções { setCookie, getCookie, deleteCookie, deleteAllCookies }
 */
export const cookieStorage = () => {

  /**
   * Adicionar ou alterar um novo valor ao cookie
   * @param {string} cname nome do cookie
   * @param {string} cvalue valor do cookie
   * @param {number} exdays tempo em dias que o cookie estara disponivel
   * @example setCookie("example", "valor exemplo");
   */
  function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
  }

  /**
   * Buscar o valor de algum cookie
   * @example
   * @param {string} cname nome do cookie
   * @returns valor
   * 
   * @example const cookieValor = getCookie("example");
   */
  function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == " ") {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }

  /**
   * Deletar algum cookie especifico
   * @param {string} cname nome do cookie
   * @example deleteCookie("example");
   */
  function deleteCookie(cname) {
    document.cookie = cname + "=";
  }

  /**
   * Deletar todos os cookie
   * 
   * deleteAllCookies();
   */
  function deleteAllCookies() {
    const cookies = document.cookie.split(";");

    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie =
        name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
  }

  return { setCookie, getCookie, deleteCookie, deleteAllCookies };
};