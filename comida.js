document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fileInput = document.getElementById('foodPhoto');
  if (!fileInput.files.length) return;

  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append('image', file);

  // Aquí deberías llamar a la API de IA externa (ejemplo ficticio)
  const response = await fetch('https://api.tu-servicio-ia.com/analyze', {
    method: 'POST',
    body: formData
  });
  const data = await response.json();

  // Mostrar resultados
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = `
    <img src="${URL.createObjectURL(file)}" alt="Comida">
    <div class="calorias">Calorías estimadas: ${data.calories} kcal</div>
  `;
});
