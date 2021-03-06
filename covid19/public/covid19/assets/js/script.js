// Le agrega funcionalidad a boton Enviar en inicio de sesión
$("#js-login").submit(async (event) => {
  event.preventDefault();
  const email = document.getElementById("correoElectronico").value;
  const password = document.getElementById("contrasena").value;
  const JWT = await postData(email, password);
  toggleNav();
  window.location.reload();
});

let paginaActual = 1;

// Obtener token
const postData = async (email, password) => {
  try {
    const response = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      body: JSON.stringify({ email: email, password, password }),
    });
    const { token } = await response.json();
    // guarda el token en localStorage
    localStorage.setItem("jwt-token", token);
    return token;
  } catch (error) {
    localStorage.clear();
    console.error(`Error: ${error}`);
  }
};

// Elimina token de localStorage para cerrar sesion
document.getElementById("logout").addEventListener("click", () => {
  localStorage.clear();
  location.reload();
});

// cambia botones de navbar
const toggleNav = () => {
  $("#login").toggle();
  $("#situacion-chile").toggle();
  $("#logout").toggle();
};

//cambia graficos al seleccionar situacion chile
const toggleChart = () => {
  $(`#chart-wrapper`).toggle();
  $(`#table-wrapper`).toggle();
  $("#myChartL").toggle();
};

// Consulta API de todos los paises
const getData = async () => {
  try {
    const response = await fetch(`http://localhost:3000/api/total`);
    const { data } = await response.json();
    if (data) {
      return data;
    }
  } catch (error) {
    localStorage.clear();
    console.error(`Error: ${error}`);
  }
};

// Grafico mundial
const graficoBarras = async () => {
  const ctx = document.getElementById("myChart");
  const data = await getData();
  const filtro = data.filter((element) => element.deaths > 100000);
  const paises = filtro.map((elemento) => elemento.location);
  const casos = filtro.map((elemento) => elemento.confirmed);
  const muertos = filtro.map((elemento) => elemento.deaths);
  const myChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: paises,
      datasets: [
        {
          label: "Confirmados",
          data: casos,
          backgroundColor: ["rgba(255, 99, 132, 0.2)"],
          borderColor: ["rgba(255, 99, 132, 1)"],
          borderWidth: 1,
        },
        {
          label: "muertos",
          data: muertos,
          backgroundColor: ["rgba(75, 192, 192, 0.2)"],
          borderColor: ["rgb(75, 192, 192)"],
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
      plugins: {
        title: {
          display: true,
          text: "Situacion mundial - COVID19",
          font: {
            size: 36,
          },
        },
        subtitle: {
          display: true,
          text: "Paises con mas de 100,000 muertes",
          font: {
            size: 24,
          },
        },
      },
    },
  });
};
graficoBarras();

// crea la tabla a partir de getData
const createTable = async () => {
  const table = document.getElementById("covidTable");
  table.innerHTML = "";
  const data = await paginacion(paginaActual);
  if (data) {
    data.forEach((country) => {
      let row = document.createElement("tr");
      row.innerHTML = `<th scope="row">${
        country.location
      }</th><td>${country.confirmed.toLocaleString()}</td><td>${country.deaths.toLocaleString()}</td><td>${
        country.recovered
      }</td><td>${
        country.active
      }</td><td><button type="button" class="btn btn-primary btn-sm" data-toggle="modal" data-target="#countryModal" data-country="${
        country.location
      }">Ver detalles</button></td>`;
      table.appendChild(row);
    });
    table.classList.remove("d-none");
  }
};
createTable();

// obtiene la informacion del endpoint /countries/$country
const getDataCountry = async (country) => {
  try {
    const response = await fetch(
      `http://localhost:3000/api/countries/${country}`
    );
    const { data } = await response.json();
    if (data) {
      return data;
    }
  } catch (error) {
    localStorage.clear();
    console.error(`Error: ${error}`);
  }
};

// Muestra el modal detallando la info de cada pais y lo actualiza con la info de getDataCountry
$("#countryModal").on("show.bs.modal", (event) => {
  const button = event.relatedTarget;
  const country = button.getAttribute("data-country");
  const countryModal = document.getElementById("countryModal");
  const countryData = async () => {
    const modalTitle = countryModal.querySelector(".modal-title");
    const modalBody = countryModal.querySelector(".modal-body");
    const data = await getDataCountry(country);
    modalTitle.textContent = "Situacion COVID en " + data.location;
    modalBody.innerHTML = `<ul>
    <li>Casos confirmados: ${data.confirmed.toLocaleString()}</li>
    <li>Muertes: ${data.deaths.toLocaleString()}</li>
    <li>Casos activos: ${data.active.toLocaleString()}</li>
    <li>Recuperados: ${data.recovered.toLocaleString()}</li>
    </ul>`;
  };
  countryData();
});

// Divide la info de getData en arrays de largo 10
async function paginacion(pagina) {
  const dataPaginacion = await getData();
  let dataPaginaActual;
  if (pagina === 1) {
    dataPaginaActual = dataPaginacion.slice(pagina - 1, pagina * 10);
  } else {
    dataPaginaActual = dataPaginacion.slice((pagina - 1) * 10, pagina * 10);
  }
  return dataPaginaActual;
}

// obtiene el numero de paginas totales para paginas de largo 10
function paginasTotales() {
  return getData().then((data) => Math.ceil(data.length / 10));
}

$(document).ready(() => {
  paginasTotales().then((res) => {
    $("#paginasTotales").text(res);
  });
});

$("#prevPage").on("click", (e) => {
  e.preventDefault();
  if (paginaActual > 1) {
    paginaActual--;
    createTable();
    $("#contadorPagina").text(paginaActual);
  }
});
$("#nextPage").on("click", (e) => {
  e.preventDefault();
  paginaActual++;
  createTable();
  $("#contadorPagina").text(paginaActual);
});

// usa el token para consumir distintos endpoints de la API
async function getDataEndpoint(endpoint) {
  try {
    const jwt = localStorage.getItem("jwt-token");
    const response = await fetch(`http://localhost:3000/api/${endpoint}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    const { data } = await response.json();
    if (data) {
      return data;
    }
  } catch (error) {
    localStorage.clear();
    console.error(`Error: ${error}`);
  }
}

// crea el grafico de lineas
async function dataGraficoChile() {
  const confirmados = await getDataEndpoint("confirmed").then((array) =>
    array.map((element) => element.total)
  );
  const muertos = await getDataEndpoint("deaths").then((array) =>
    array.map((element) => element.total)
  );
  const recuperados = await getDataEndpoint("recovered").then((array) =>
    array.map((element) => element.total)
  );
  const etiquetas = await getDataEndpoint("recovered").then((array) =>
    array.map((element) => element.date)
  );
  const ctx = document.getElementById("myChartL");
  const myChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: etiquetas,
      datasets: [
        {
          label: "Confirmados",
          data: confirmados,
          backgroundColor: ["rgba(255, 255, 0, 0.3)"],
        },
        {
          label: "Muertos",
          data: muertos,
          backgroundColor: ["rgba(255, 0, 0, 0.3)"],
        },
        {
          label: "Recuperados",
          data: recuperados,
          backgroundColor: ["rgba(0, 0, 255, 0.3)"],
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
      plugins: {
        title: {
          display: true,
          text: "Situacion Chile - COVID19",
          font: {
            size: 36,
          },
        },
        subtitle: {
          display: true,
          text: "Evolucion de casos",
          font: {
            size: 24,
          },
        },
      },
    },
  });
}
dataGraficoChile().then(() => $("#cargando").remove());

//agrega toggleChart a boton situacion chile
document
  .getElementById("situacion-chile")
  .addEventListener("click", function () {
    if ($("#chart-wrapper").is(":visible")) {
      toggleChart();
      displayCargando();
    }
  });

document.getElementById("home").addEventListener("click", function () {
  if ($("#myChartL").is(":visible")) {
    toggleChart();
    hideCargando();
  }
});
// chequea que haya un token en localStorage
(() => {
  const token = localStorage.getItem("jwt-token");
  if (token) {
    toggleNav();
  }
})();

const cargando = document.getElementById("cargando");
function displayCargando() {
  cargando.classList.add("display");
}

function hideCargando() {
  cargando.classList.remove("display");
}
