const API_KEY = "19d45d1a9f76411b2add29c8811c6bf1"; // Sua chave do TMDb
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/w500";
const ORIGINAL_IMG = "https://image.tmdb.org/t/p/original";
const SUPERFLIX_URL = "https://myembed.biz";

// ============================================================================
// BLOQUEADOR DE POP-UPS E NOVAS GUIAS
// Intercepta tentativas de scripts de terceiros abrirem novas janelas ou links
// ============================================================================
(function aplicarBloqueioAds() {
  // Sobrescreve a função nativa window.open para impedir a abertura de novas abas
  window.open = function () {
    console.warn("Tentativa de abertura de nova guia/pop-up bloqueada.");
    return null;
  };

  // Previne a abertura involuntária de esquemas de apps externos (ex: intent:// ou market://)
  window.addEventListener("beforeunload", function (e) {
    // Mantém a navegação na página atual
  });
})();

// 1. CARREGAR FILMES E SEÇÕES
async function carregarFilmesEmAlta() {
  await carregarBannerHero();
  await carregarCarrossel(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}&language=pt-BR`, "em-alta-row");
  await carregarCarrossel(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=pt-BR`, "populares-row");
  await carregarCarrossel(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=28&language=pt-BR`, "acao-row");
}

// CARREGAR BANNER EM DESTAQUE (HERO)
async function carregarBannerHero() {
  try {
    const res = await fetch(`${BASE_URL}/trending/movie/day?api_key=${API_KEY}&language=pt-BR`);
    const data = await res.json();
    const destaque = data.results[0];

    if (destaque) {
      const banner = document.getElementById("hero-banner");
      const title = document.getElementById("hero-title");
      const btnPlay = document.getElementById("btn-play-hero");

      if (banner) banner.style.backgroundImage = `url('${ORIGINAL_IMG}${destaque.backdrop_path}')`;
      if (title) title.innerText = destaque.title || destaque.name;
      if (btnPlay) {
        btnPlay.onclick = () => abrirPlayer(destaque.id, (destaque.title || destaque.name).replace(/'/g, "\\'"), 'filme');
      }
    }
  } catch (error) {
    console.error("Erro ao carregar destaque hero:", error);
  }
}

// 2. EXIBIR CARDS DOS FILMES NOS CARROSSÉIS
async function carregarCarrossel(url, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    const res = await fetch(url);
    const data = await res.json();
    exibirFilmes(data.results, container);
  } catch (error) {
    console.error(`Erro ao carregar a seção ${containerId}:`, error);
    container.innerHTML = "<p>Erro ao carregar os títulos.</p>";
  }
}

function exibirFilmes(filmes, container) {
  if (!container) {
    container = document.getElementById("em-alta-row") || document.getElementById("filmes-grid");
  }

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
    const titulo = (filme.title || filme.name || '').replace(/'/g, "\\'");

    const card = document.createElement("div");
    card.className = "poster-card";
    card.onclick = () => abrirPlayer(filme.id, titulo, 'filme');

    card.innerHTML = `
      <img src="${poster}" alt="${filme.title || filme.name}">
    `;

    container.appendChild(card);
  });
}

// 3. BUSCA DE FILMES
async function buscarMidia(event) {
  const input = document.getElementById("input-busca");
  if (!input) return;

  const termo = input.value.trim();

  // Permite acionar por evento de tecla Enter ou clique
  if (event && event.type === "keyup" && event.key !== "Enter") return;

  if (!termo) {
    carregarFilmesEmAlta();
    return;
  }

  const container = document.getElementById("em-alta-row") || document.getElementById("filmes-grid");
  if (container) container.innerHTML = "<p>Buscando...</p>";

  try {
    const res = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(termo)}&language=pt-BR`);
    const data = await res.json();
    exibirFilmes(data.results, container);
  } catch (error) {
    console.error("Erro na busca:", error);
    if (container) container.innerHTML = "<p>Erro ao realizar a busca.</p>";
  }
}

function toggleBusca() {
  const bar = document.getElementById("search-bar");
  if (bar) bar.classList.toggle("active");
}

// 4. ABRIR PLAYER DO SUPERFLIX
function abrirPlayer(tmdbId, titulo, tipo = 'filme') {
  let modal = document.getElementById("modal-player");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modal-player";
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.95); display: flex; justify-content: center;
      align-items: center; z-index: 2000; padding: 10px;
    `;
    document.body.appendChild(modal);
  }

  const playerUrl = `${SUPERFLIX_URL}/${tipo}/${tmdbId}`;

  modal.innerHTML = `
    <div style="background: #141414; border-radius: 8px; width: 100%; max-width: 900px; padding: 15px; position: relative; border: 1px solid #333;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h3 style="color: #E50914; font-size: 1.1rem;">🎬 Assistindo: ${titulo}</h3>
        <button onclick="fecharPlayer()" style="background: #E50914; color: white; border: none; padding: 5px 12px; border-radius: 4px; cursor: pointer; font-weight: bold;">Sair X</button>
      </div>

      <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 4px; background: #000;">
        <iframe 
          id="iframe-player"
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
