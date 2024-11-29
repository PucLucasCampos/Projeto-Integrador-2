export function formatDateForOracle(date) {
    const [day, month, year] = date.split("/");
    return `${year}-${month}-${day}`; // Formato yyyy-mm-dd
  }
  