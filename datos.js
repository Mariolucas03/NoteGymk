// Cargar rutinas desde localStorage y migrar fechas antiguas a formato ISO
let rutinas = JSON.parse(localStorage.getItem("rutinas")) || [];

rutinas.forEach(r => {
  if (r.fecha && r.fecha.includes("/")) {
    const [dia, mes, año] = r.fecha.split("/");
    r.fecha = `${año}-${mes.padStart(2,"0")}-${dia.padStart(2,"0")}`;
  }
});
localStorage.setItem("rutinas", JSON.stringify(rutinas));

const calendar = document.getElementById("calendar");
const detalle = document.getElementById("detalle");
const monthLabel = document.getElementById("monthLabel");

// Mes inicial permitido (el actual)
const initialYear = new Date().getFullYear();
const initialMonth = new Date().getMonth();

let currentYear = initialYear;
let currentMonth = initialMonth;

function renderCalendar(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let html = "<table><tr>";
  const diasSemana = ["D", "L", "M", "X", "J", "V", "S"];
  diasSemana.forEach(d => html += `<th>${d}</th>`);
  html += "</tr><tr>";

  for (let i = 0; i < firstDay; i++) {
    html += "<td></td>";
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const fechaFormateada = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const tieneRutina = rutinas.some(r => r.fecha === fechaFormateada);

    let claseDia = "";
    const limiteHoy = new Date(); limiteHoy.setHours(23,59,59,999);
    const fechaDia = new Date(year, month, d);

    if (tieneRutina) {
      claseDia = "con-rutina";
    } else if (fechaDia < limiteHoy) {
      claseDia = "sin-rutina";
    }

    html += `<td class="${claseDia}" data-fecha="${fechaFormateada}">${d}</td>`;
    if ((d + firstDay) % 7 === 0) html += "</tr><tr>";
  }

  html += "</tr></table>";
  calendar.innerHTML = html;

  const nombreMes = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
  ];
  monthLabel.textContent = `${nombreMes[month]} ${year}`;

  // Evento click en día → mostrar TODAS las rutinas de ese día
  calendar.querySelectorAll("td[data-fecha]").forEach(td => {
    td.addEventListener("click", () => {
      const fechaClick = td.dataset.fecha;
      const rutinasDia = rutinas.filter(r => r.fecha === fechaClick);

      if (rutinasDia.length > 0) {
        detalle.innerHTML = rutinasDia.map(rutina => {
          let ejerciciosHTML = "";

          // ===== Fuerza (igual que antes) =====
          const ejercicios = rutina.ejercicios || {};
          for (const [key, valores] of Object.entries(ejercicios)) {
            if (key.endsWith("_kg[]")) {
              const nombreEjercicio = key.replace("_kg[]", "");
              const kgSeries = (valores || []).filter(v => v !== "" && v !== null);
              const repsSeries = ejercicios[`${nombreEjercicio}_reps[]`] || [];

              if (kgSeries.length > 0) {
                ejerciciosHTML += `
                  <div class="ejercicio-card">
                    <h3>${nombreEjercicio.replace(/_/g," ")}</h3>
                    <table>
                      <thead>
                        <tr><th>Serie</th><th>Kg</th><th>Reps</th></tr>
                      </thead>
                      <tbody>
                        ${kgSeries.map((kg, i) => `
                          <tr>
                            <td>${i+1}</td>
                            <td>${kg}</td>
                            <td>${repsSeries[i] || ""}</td>
                          </tr>
                        `).join("")}
                      </tbody>
                    </table>
                  </div>
                `;
              }
            }
          }

          // ===== Cardio desde ejercicios (tabla única) =====
          const cardioKm = ejercicios["cardio_km[]"] || [];
          const cardioTiempo = ejercicios["cardio_tiempo[]"] || [];
          const cardioVelocidad = ejercicios["cardio_velocidad[]"] || [];
          const cardioKcal = ejercicios["cardio_kcal[]"] || [];

          const cardioFilas = Math.max(
            cardioKm.length,
            cardioTiempo.length,
            cardioVelocidad.length,
            cardioKcal.length
          );

          if (cardioFilas > 0) {
            ejerciciosHTML += `
              <div class="ejercicio-card">
                <h3>Cardio</h3>
                <table>
                  <thead>
                    <tr><th>Km</th><th>Tiempo</th><th>Km/s</th><th>Kcal</th></tr>
                  </thead>
                  <tbody>
                    ${Array.from({ length: cardioFilas }).map((_, i) => `
                      <tr>
                        <td>${cardioKm[i] || ""}</td>
                        <td>${cardioTiempo[i] || ""}</td>
                        <td>${cardioVelocidad[i] || ""}</td>
                        <td>${cardioKcal[i] || ""}</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>
            `;
          }

          // ===== Pádel desde ejercicios (tabla única) =====
          const padelTiempo = ejercicios["padel_tiempo[]"] || [];
          const padelDetalles = ejercicios["padel_detalles[]"] || [];
          const padelKcal = ejercicios["padel_kcal[]"] || [];

          const padelFilas = Math.max(
            padelTiempo.length,
            padelDetalles.length,
            padelKcal.length
          );

          if (padelFilas > 0) {
            ejerciciosHTML += `
              <div class="ejercicio-card">
                <h3>Pádel</h3>
                <table>
                  <thead>
                    <tr><th>Tiempo</th><th>Detalles</th><th>Kcal</th></tr>
                  </thead>
                  <tbody>
                    ${Array.from({ length: padelFilas }).map((_, i) => `
                      <tr>
                        <td>${padelTiempo[i] || ""}</td>
                        <td>${padelDetalles[i] || ""}</td>
                        <td>${padelKcal[i] || ""}</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>
            `;
          }

          return `
            <div class="rutina-dia">
              <h3>Rutina del ${rutina.fecha}</h3>
              ${ejerciciosHTML || "<p>No se registraron ejercicios.</p>"}
            </div>
          `;
        }).join("<hr>");
      } else {
        detalle.innerHTML = `<p>No hay rutina registrada este día.</p>`;
      }
    });
  });
}

// Botón mes anterior con límite en el mes inicial
document.getElementById("prevMonth").addEventListener("click", () => {
  if (!(currentYear === initialYear && currentMonth === initialMonth)) {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar(currentYear, currentMonth);
  }
});

// Botón mes siguiente sin límite
document.getElementById("nextMonth").addEventListener("click", () => {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar(currentYear, currentMonth);
});

// Render inicial
renderCalendar(currentYear, currentMonth);

// Exportar rutinas a archivo JSON
document.getElementById("exportRutinas").addEventListener("click", () => {
  const rutinas = JSON.parse(localStorage.getItem("rutinas")) || [];
  const blob = new Blob([JSON.stringify(rutinas, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "rutinas_backup.json";
  a.click();

  URL.revokeObjectURL(url);
});

// Importar rutinas desde archivo JSON
document.getElementById("importRutinas").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const rutinasImportadas = JSON.parse(e.target.result);
      if (Array.isArray(rutinasImportadas)) {
        rutinasImportadas.forEach(r => {
          if (typeof r.fecha === "string" && r.fecha.includes("/")) {
            const [dia, mes, año] = r.fecha.split("/");
            r.fecha = `${año}-${mes.padStart(2,"0")}-${dia.padStart(2,"0")}`;
          }
        });
        localStorage.setItem("rutinas", JSON.stringify(rutinasImportadas));
        alert("Rutinas importadas correctamente ✅");
        location.reload();
      } else {
        alert("El archivo no tiene el formato correcto ❌");
      }
    } catch (err) {
      alert("Error al leer el archivo ❌");
    }
  };
  reader.readAsText(file);
});
