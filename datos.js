const rutinas = JSON.parse(localStorage.getItem("rutinas")) || [];
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
    // Formato ISO: YYYY-MM-DD
    const fechaFormateada = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const tieneRutina = rutinas.some(r => r.fecha === fechaFormateada);

    let claseDia = "";
    const hoy = new Date();

    if (tieneRutina) {
      claseDia = "con-rutina";
    } else if (
      year < hoy.getFullYear() ||
      (year === hoy.getFullYear() && month < hoy.getMonth()) ||
      (year === hoy.getFullYear() && month === hoy.getMonth() && d < hoy.getDate())
    ) {
      claseDia = "sin-rutina";
    }

    // Día actual
    if (year === hoy.getFullYear() && month === hoy.getMonth() && d === hoy.getDate()) {
      claseDia += " hoy";
    }

    html += `<td class="${claseDia}" data-fecha="${fechaFormateada}">${d}</td>`;
    if ((d + firstDay) % 7 === 0) html += "</tr><tr>";
  }

  html += "</tr></table>";
  calendar.innerHTML = html;

  // Etiqueta del mes
  const nombreMes = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
  ];
  monthLabel.textContent = `${nombreMes[month]} ${year}`;

  // Evento click en día
  calendar.querySelectorAll("td[data-fecha]").forEach(td => {
    td.addEventListener("click", () => {
      const fechaClick = td.dataset.fecha;
      const rutina = rutinas.find(r => r.fecha === fechaClick);

      if (rutina) {
        let ejerciciosHTML = "";

        for (const [key, valores] of Object.entries(rutina.ejercicios)) {
          const valoresLimpios = valores.filter(v => v !== "" && v !== null);

          if (valoresLimpios.length > 0 && key.endsWith("_kg[]")) {
            const nombreEjercicio = key.replace("_kg[]", "");
            const reps = rutina.ejercicios[`${nombreEjercicio}_reps[]`] || [];

            ejerciciosHTML += `
              <div class="ejercicio-card">
                <h3>${nombreEjercicio}</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Serie</th>
                      <th>Kg</th>
                      <th>Reps</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${valoresLimpios.map((kg, i) => `
                      <tr>
                        <td>${i+1}</td>
                        <td>${kg}</td>
                        <td>${reps[i] || ""}</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>
            `;
          }
        }

        detalle.innerHTML = `
          <h3>Rutina del ${rutina.fecha}</h3>
          <p><span class="tiempo-destacado">${rutina.tiempo}</span></p>
          ${ejerciciosHTML || "<p>No se registraron ejercicios.</p>"}
        `;
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
        localStorage.setItem("rutinas", JSON.stringify(rutinasImportadas));
        alert("Rutinas importadas correctamente ✅");
        location.reload(); // recargamos para verlas en el calendario
      } else {
        alert("El archivo no tiene el formato correcto ❌");
      }
    } catch (err) {
      alert("Error al leer el archivo ❌");
    }
  };
  reader.readAsText(file);
});
