export function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  export function formatDateTime(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  export function formatearFecha(fecha) {
    const meses = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];
  
    const mesesAbreviados = [
      "Ene", "Feb", "Mar", "Abr", "May", "Jun",
      "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
    ];
  
    const fechaObj = new Date(fecha);
    const dia = fechaObj.getDate();
    const mes = mesesAbreviados[fechaObj.getMonth()];
    const ano = fechaObj.getFullYear();
    const horas = fechaObj.getHours() % 12 || 12; // Formato de 12 horas
    const minutos = fechaObj.getMinutes();
    const ampm = fechaObj.getHours() >= 12 ? 'P.M.' : 'A.M.';
  
    const fechaFormateada = `${dia} ${mes} ${ano} ${horas}:${minutos < 10 ? '0' : ''}${minutos} ${ampm}`;
    return fechaFormateada;
  }

  export function calcularEdad(fechaNacimiento) {
    const fechaNacimientoObj = new Date(fechaNacimiento);
    const ahora = new Date();
  
    let edad = ahora.getFullYear() - fechaNacimientoObj.getFullYear();
    const mesActual = ahora.getMonth();
    const mesNacimiento = fechaNacimientoObj.getMonth();
  
    if (mesActual < mesNacimiento || (mesActual === mesNacimiento && ahora.getDate() < fechaNacimientoObj.getDate())) {
      edad--;
    }
  
    return edad;
  }

  export function formatDateTimeColumn(dateString) {
  
    const date = new Date(dateString);
  
    const isNullDate = date.getFullYear() === 1969 &&
    date.getMonth() === 11 &&
    date.getDate() === 31 &&
    date.getHours() === 19 &&
    date.getMinutes() === 0 &&
    date.getSeconds() === 0;
    if (isNullDate) {
      return null;
      }

  
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    let hours = date.getHours();
    const isPM = hours >= 12;
  
    // Convert hours to 12-hour format
    hours = hours % 12 || 12;
  
    const formattedHours = String(hours).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const period = isPM ? 'PM' : 'AM';
  
    return `${year}-${month}-${day} ${formattedHours}:${minutes}:${seconds} ${period}`;
  }