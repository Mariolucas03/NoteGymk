let startTime, interval, elapsedPaused = 0;
const contador = document.getElementById("contador");

// Iniciar cronómetro
document.getElementById("start").addEventListener("click", () => {
  startTime = Date.now() - elapsedPaused * 1000; // reanuda si estaba pausado
  interval = setInterval(updateTime, 1000);
});

// Pausar cronómetro
document.getElementById("pause").addEventListener("click", () => {
  clearInterval(interval);
  // guarda el tiempo transcurrido hasta la pausa
  elapsedPaused = Math.floor((Date.now() - startTime) / 1000);
});

function updateTime() {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const min = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const sec = String(elapsed % 60).padStart(2, "0");
  contador.textContent = `${min}:${sec}`;
}

// Definir rutinas
const rutinas = {
  pecho1: [
    { nombre: "Press Inclinado" },
    { nombre: "Extensión de Tríceps" },
    { nombre: "Hombro Alas" },
    { nombre: "Aperturas de Pecho" },
    { nombre: "Tríceps Francés" },
    { nombre: "Hombro Posterior" }
  ],
  biceps1: [
    { nombre: "Jalón al Pecho" },
    { nombre: "Bayessian" },
    { nombre: "Remo" },
    { nombre: "Martillo" },
    { nombre: "Pull Over" },
    { nombre: "Curl Bíceps" },
    { nombre: "Dominadas" }
  ],
  pierna1: [
    { nombre: "Abductor" },
    { nombre: "Aductor" },
    { nombre: "Gemelo" },
    { nombre: "Extensión Cuádriceps" },
    { nombre: "Femoral" },
    { nombre: "Prensa de Pie" },
    { nombre: "Prensa Tumbado" },
    { nombre: "Sentadilla" },
    { nombre: "Abdominales" },
    { nombre: "Rodillas Arriba" },
    { nombre: "Oblicuos" }
  ],
  cardio: "especial",
  padel: "especial"
};

// Obtener tipo de rutina desde la URL
const params = new URLSearchParams(window.location.search);
const tipo = params.get("tipo");
const contenedor = document.getElementById("contenidoRutina");

// Crear tarjetas de ejercicios
if (rutinas[tipo] && rutinas[tipo] !== "especial") {
  rutinas[tipo].forEach(ej => {
    const card = document.createElement("div");
    card.classList.add("ejercicio-card");

    card.innerHTML = `
      <h3>${ej.nombre}</h3>
      <table>
        <thead>
          <tr>
            <th>Serie</th>
            <th>Kg</th>
            <th>Reps</th>
          </tr>
        </thead>
        <tbody>
          ${crearFilas(3, ej.nombre, 0)}
        </tbody>
      </table>
      <button type="button" class="add-serie">Añadir serie</button>
    `;

    // Evento para añadir serie
    card.querySelector(".add-serie").addEventListener("click", () => {
      const tbody = card.querySelector("tbody");
      const numSeries = tbody.querySelectorAll("tr").length;
      const nuevaFila = crearFilas(1, ej.nombre, numSeries);
      tbody.insertAdjacentHTML("beforeend", nuevaFila);
    });

    contenedor.appendChild(card);
  });
} else if (tipo === "cardio") {
  // Tabla especial para Cardio
  const card = document.createElement("div");
  card.classList.add("ejercicio-card");
  card.innerHTML = `
    <h3>Cardio</h3>
    <table>
      <thead>
        <tr>
          <th>Tiempo Total (min)</th>
          <th>Km</th>
          <th>Km/s</th>
          <th>Kcal</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><input type="number" name="cardio_tiempo"></td>
          <td><input type="number" name="cardio_km"></td>
          <td><input type="number" name="cardio_kms"></td>
          <td><input type="number" name="cardio_kcal"></td>
        </tr>
      </tbody>
    </table>
  `;
  contenedor.appendChild(card);
} else if (tipo === "padel") {
  // Tabla especial para Padel
  const card = document.createElement("div");
  card.classList.add("ejercicio-card");
  card.innerHTML = `
    <h3>Padel</h3>
    <table>
      <thead>
        <tr>
          <th>Tiempo (min)</th>
          <th>Kcal</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><input type="number" name="padel_tiempo"></td>
          <td><input type="number" name="padel_kcal"></td>
        </tr>
      </tbody>
    </table>
  `;
  contenedor.appendChild(card);
} else {
  contenedor.innerHTML = "<p>No se encontró la rutina seleccionada.</p>";
}

// Función para crear filas numeradas
function crearFilas(num, nombre, offset) {
  let filas = "";
  for (let i = 1; i <= num; i++) {
    const serieNum = offset + i;
    filas += `
      <tr>
        <td>${serieNum}</td>
        <td><input type="number" name="${nombre}_kg[]"></td>
        <td><input type="number" name="${nombre}_reps[]"></td>
      </tr>
    `;
  }
  return filas;
}

// Guardar rutina
document.getElementById("rutinaForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const ejercicios = {};
  formData.forEach((val, key) => {
    if (!ejercicios[key]) ejercicios[key] = [];
    ejercicios[key].push(val);
  });

  // Fecha en formato DD/MM/YYYY
  const hoy = new Date();
  const fecha = `${String(hoy.getDate()).padStart(2,"0")}/${String(hoy.getMonth()+1).padStart(2,"0")}/${hoy.getFullYear()}`;

  const rutina = {
    fecha: fecha,   // ejemplo: 06/11/2025
    tiempo: contador.textContent,
    ejercicios
  };

  const rutinasGuardadas = JSON.parse(localStorage.getItem("rutinas")) || [];
  rutinasGuardadas.push(rutina);
  localStorage.setItem("rutinas", JSON.stringify(rutinasGuardadas));

  alert("Rutina guardada ✅");
  window.location.href = "datos.html";
});
