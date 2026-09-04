const API_KEY = "19d45d1a9f76411b2add29c8811c6bf1";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/w500";
const ORIGINAL_IMG = "https://image.tmdb.org/t/p/original";
const SUPERFLIX_URL = "https://myembed.biz";

// Bloqueio de novas janelas acionadas por scripts do embed
window.open = function () { return null; };

// 1. INICIALIZAÇÃO E CARREGAMENTO DE SEÇÕES
async function carregarCatalogos() {
  await carregarBannerHero();
  await carregarCarrossel(`${BASE_URL}/trending/all/week?api_key=${API_KEY}&language=pt-BR`, "em-alta-row");
  await carregarCarrossel(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=pt-BR`, "populares-row");
  await carregarCarrossel(`${BASE_URL}/tv/popular?api_key=${API_KEY}&language=pt-BR`, "acao-row");
}

// 2. HERO BANNER
async function carregarBannerHero() {
  try {
    const res = await fetch(`${BASE_URL}/trending/all/day?api_key=${API_KEY}&language=pt-BR`);
    const data = await res.json();
    const destaque = data.results[0];

    if (destaque) {
      const banner = document.getElementById("hero-banner");
      const title = document.getElementById("hero-title");
      const btnPlay = document.getElementById("btn-play-hero");
      const mediaType = destaque.media_type || (destaque.first_air_date ? 'tv' : 'movie');

      if (banner) banner.style.backgroundImage = `url('${ORIGINAL_IMG}${destaque.backdrop_path}')`;
      if (title) title.innerText = destaque.title || destaque.name;
      if (btnPlay) {
        btnPlay.onclick = () => processarEMostrarPlayer(destaque.id, destaque.title || destaque.name, mediaType);
      }
    }
  } catch (error) {
    console.error("Erro no banner principal:", error);
  }
}

// 3. CARROSSÉIS E CARDS (IDENTIFICAÇÃO DE TIPO DE MÍDIA)
async function carregarCarrossel(url, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    const res = await fetch(url);
    const data = await res.json();
    exibirFilmes(data.results, container);
  } catch (error) {
    console.error(`Erro ao carregar ${containerId}:`, error);
  }
}

function exibirFilmes(itens, container) {
  if (!container) container = document.getElementById("em-alta-row");
  container.innerHTML = "";

  if (!itens || itens.length === 0) {
    container.innerHTML = "<p>Nenhum resultado encontrado.</p>";
    return;
  }

  itens.forEach(item => {
    if (!item.poster_path) return;

    // Identifica se é filme ou série com base nos campos retornado pelo TMDb
    const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    const titulo = (item.title || item.name || '').replace(/'/g, "\\'");

    const card = document.createElement("div");
    card.className = "poster-card";
    card.onclick = () => processarEMostrarPlayer(item.id, titulo, mediaType);

    card.innerHTML = `<img src="${IMG_URL}${item.poster_path}" alt="${titulo}">`;
    container.appendChild(card);
  });
}

// 4. LÓGICA DE DETALHES (TEMPORADAS/EPISÓDIOS PARA SÉRIES)
async function processarEMostrarPlayer(tmdbId, titulo, tipo) {
  let detalhesExtra = "";

  if (tipo === 'tv' || tipo === 'serie') {
    try {
      const res = await fetch(`${BASE_URL}/tv/${tmdbId}?api_key=${API_KEY}&language=pt-BR`);
      const dadosSerie = await res.json();
      
      const numTemporadas = dadosSerie.number_of_seasons || 1;
      const numEpisodios = dadosSerie.number_of_episodes || 0;
      
      detalhesExtra = `<span style="font-size:0.85rem; color:#a0aec0; margin-left:10px;">📺 ${numTemporadas} Temp. (${numEpisodios} Ep.)</span>`;
    } catch (e) {
      console.error("Erro ao buscar detalhes da série:", e);
    }
  }

  salvarNoHistorico(tmdbId, titulo, tipo);
  abrirPlayer(tmdbId, titulo, tipo, detalhesExtra);
}

// 5. PLAYER DE VÍDEO COM EMBED
function abrirPlayer(tmdbId, titulo, tipo = 'filme', detalhesExtra = "") {
  let modal = document.getElementById("modal-player");
  const endpointTipo = (tipo === 'tv' || tipo === 'serie') ? 'serie' : 'filme';

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

  const playerUrl = `${SUPERFLIX_URL}/${endpointTipo}/${tmdbId}`;

  modal.innerHTML = `
    <div style="background: #141414; border-radius: 8px; width: 100%; max-width: 900px; padding: 15px; position: relative; border: 1px solid #333;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h3 style="color: #E50914; font-size: 1rem;">🎬 ${titulo} ${detalhesExtra}</h3>
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

function fecharPlayer() {
  const modal = document.getElementById("modal-player");
  if (modal) {
    modal.innerHTML = "";
    modal.style.display = "none";
  }
}

// 6. SISTEMA DE HISTÓRICO LOCAL
function salvarNoHistorico(id, titulo, tipo) {
  let historico = JSON.parse(localStorage.getItem("cineflix_historico") || "[]");
  historico = historico.filter(item => item.id !== id); // Evita duplicados
  historico.unshift({ id, titulo, tipo, data: new Date().toLocaleDateString('pt-BR') });
  
  if (historico.length > 20) historico.pop(); // Limita aos últimos 20
  localStorage.setItem("cineflix_historico", JSON.stringify(historico));
}

function abrirHistorico() {
  const historico = JSON.parse(localStorage.getItem("cineflix_historico") || "[]");
  if (historico.length === 0) {
    alert("Seu histórico de exibição está vazio.");
    return;
  }

  let listaText = "🕒 Últimos assistidos:\n\n";
  historico.forEach(item => {
    const rotulo = (item.tipo === 'tv' || item.tipo === 'serie') ? '📺 Série' : '🎬 Filme';
    listaText += `${rotulo}: ${item.titulo} (${item.data})\n`;
  });

  alert(listaText);
}

// 7. ABA DE CANAIS ESPORTIVOS
function abrirCanaisEsportivos() {
  // Redireciona ou carrega a seção de esportes em uma nova aba
  window.openOriginal = window.open; // Referência para acionar navegação legítima
  const abaEsportes = window.openOriginal(`${SUPERFLIX_URL}/futebol`, '_blank');
}

// BUSCA MULTI-MÍDIA
async function buscarMidia(event) {
  const input = document.getElementById("input-busca");
  if (!input) return;

  const termo = input.value.trim();
  if (event && event.type === "keyup" && event.key !== "Enter") return;
  if (!termo) { carregarCatalogos(); return; }

  const container = document.getElementById("em-alta-row");
  if (container) container.innerHTML = "<p>Buscando...</p>";

  try {
    const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(termo)}&language=pt-BR`);
    const data = await res.json();
    exibirFilmes(data.results, container);
  } catch (error) {
    console.error("Erro na busca:", error);
  }
}

function toggleBusca() {
  const bar = document.getElementById("search-bar");
  if (bar) bar.classList.toggle("active");
}

document.addEventListener("DOMContentLoaded", carregarCatalogos);
