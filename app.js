const API_KEY = "19d45d1a9f76411b2add29c8811c6bf1"; // Sua chave do TMDb
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/w500";
const SUPERFLIX_URL = "https://myembed.biz";

// 1. CARREGAR FILMES POPULARES
async function carregarFilmesEmAlta() {
  const container = document.getElementById("filmes-grid");
  container.innerHTML = "<p>Carregando catálogo...</p>";

  try {
    const res = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}&language=pt-BR`);
    const data = await res.json();
    exibirFilmes(data.results);
  } catch (error) {
    console.error("Erro na requisição:", error);
    container.innerHTML = "<p>Erro ao carregar o catálogo de filmes.</p>";
  }
}

// 2. EXIBIR CARDS DOS FILMES
function exibirFilmes(filmes) {
  const container = document.getElementById("filmes-grid");
  container.innerHTML = "";

  if (!filmes || filmes.length === 0) {
    container.innerHTML = "<p>Nenhum resultado encontrado.</p>";
    return;
  }

  filmes.forEach(filme => {
    const poster = filme.poster_path 
      ? `${IMG_URL}${filme.poster_path}` 
      : 'https://via.placeholder.com/500x750?text=Sem+Foto';

    const nota = filme.vote_average ? filme.vote_average.toFixed(1) : 'N/A';
    const ano = filme.release_date ? filme.release_date.split('-')[0] : 'N/A';

    container.innerHTML += `
      <div class="card" onclick="abrirPlayer(${filme.id}, '${filme.title.replace(/'/g, "\\'")}', 'filme')">
        <img src="${poster}" alt="${filme.title}">
        <div class="card-body">
          <h3>${filme.title}</h3>
          <div class="info">
            <span>📅 ${ano}</span>
            <span class="rating">⭐ ${nota}</span>
          </div>
        </div>
      </div>
    `;
  });
}

// 3. BUSCA DE FILMES
async function buscarMidia() {
  const termo = document.getElementById("input-busca").value.trim();
  if (!termo) {
    carregarFilmesEmAlta();
    return;
  }

  const container = document.getElementById("filmes-grid");
  container.innerHTML = "<p>Buscando...</p>";

  try {
    const res = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(termo)}&language=pt-BR`);
    const data = await res.json();
    exibirFilmes(data.results);
  } catch (error) {
    console.error("Erro na busca:", error);
    container.innerHTML = "<p>Erro ao realizar a busca.</p>";
  }
}

// 4. ABRIR PLAYER DO SUPERFLIX COM RESTRIÇÃO DE POP-UPS (SANDBOX)
// 4. ABRIR PLAYER DO SUPERFLIX
function abrirPlayer(tmdbId, titulo, tipo = 'filme') {
  let modal = document.getElementById("modal-player");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modal-player";
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.9); display: flex; justify-content: center;
      align-items: center; z-index: 2000; padding: 10px;
    `;
    document.body.appendChild(modal);
  }

  const playerUrl = `${SUPERFLIX_URL}/${tipo}/${tmdbId}`;

  modal.innerHTML = `
    <div style="background: #1e293b; border-radius: 12px; width: 100%; max-width: 900px; padding: 15px; position: relative;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h3 style="color: #eab308; font-size: 1.1rem;">🎬 Assistindo: ${titulo}</h3>
        <button onclick="fecharPlayer()" style="background: #ef4444; color: white; border: none; padding: 5px 12px; border-radius: 6px; cursor: pointer; font-weight: bold;">Sair X</button>
      </div>

      <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px; background: #000;">
        <iframe 
          src="${playerUrl}" 
          style="position: absolute; top:0; left: 0; width: 100%; height: 100%; border: none;" 
          allowfullscreen 
          scrolling="no">
        </iframe>
      </div>
    </div>
  `;

  modal.style.display = "flex";
}

// 5. FECHAR O PLAYER E PARAR O VÍDEO
function fecharPlayer() {
  const modal = document.getElementById("modal-player");
  if (modal) {
    modal.innerHTML = "";
    modal.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", carregarFilmesEmAlta);
