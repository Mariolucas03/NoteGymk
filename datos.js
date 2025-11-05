const rutinas = JSON.parse(localStorage.getItem("rutinas")) || [];
const calendar = document.getElementById("calendar");
const detalle = document.getElementById("detalle");

// Crear calendario simple del mes actual
const hoy = new Date();
const year = hoy.getFullYear();
const month = hoy.getMonth();

const firstDay = new Date(year, month, 1).getDay();
const daysInMonth = new Date(year, month + 1, 0).getDate();

let html = "<table><tr>";
const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
diasSemana.forEach(d => html += `<th>${d}</th>`);
html += "</tr><tr>";

for (let i = 0; i < firstDay; i++) {
  html += "<td></td>";
}

for (let d = 1; d <= daysInMonth; d++) {
  const fecha = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const tieneRutina = rutinas.some(r => r.fecha === fecha);
  html += `<td class="${tieneRutina ? 'con-rutina' : ''}" data-fecha="${fecha}">${d}</td>`;
  if ((d + firstDay) % 7 === 0) html += "</tr><tr>";
}

html += "</tr></table>";
calendar.innerHTML = html;

// Evento click en día
calendar.querySelectorAll("td[data-fecha]").forEach(td => {
  td.addEventListener("click", () => {
    const fecha = td.dataset.fecha;
    const rutina = rutinas.find(r => r.fecha === fecha);
    if (rutina) {
      detalle.innerHTML = `
        <h3>Rutina del ${fecha}</h3>
        <p>Tiempo: ${rutina.tiempo}</p>
        <pre>${JSON.stringify(rutina.ejercicios, null, 2)}</pre>
      `;
    } else {
      detalle.innerHTML = `<p>No hay rutina registrada este día.</p>`;
    }
  });
});
