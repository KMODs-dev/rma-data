const API_KEY = "19d45d1a9f76411b2add29c8811c6bf1";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/w500";
const ORIGINAL_IMG = "https://image.tmdb.org/t/p/original";
const SUPERFLIX_URL = "https://myembed.biz";

let mediaAtualId = null;
let mediaAtualTipo = null;

// ============================================================================
// BLOQUEADOR DE POP-UPS E NOVAS GUIAS
// Intercepta tentativas de scripts de terceiros abrirem novas janelas ou links
// ============================================================================
(function aplicarBloqueioAds() {
  window.open = function () {
    console.warn("Tentativa de abertura de nova guia/pop-up bloqueada.");
    return null;
  };

  window.addEventListener("beforeunload", function (e) {
    // Mantém a navegação na página atual
  });
})();

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
        btnPlay.onclick = () => abrirDetalhes(destaque.id, mediaType);
      }
    }
  } catch (error) {
    console.error("Erro no banner principal:", error);
  }
}

// 3. CARROSSÉIS E CARDS
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

    const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    const titulo = (item.title || item.name || '').replace(/'/g, "\\'");

    const card = document.createElement("div");
    card.className = "poster-card";
    card.onclick = () => abrirDetalhes(item.id, mediaType);

    card.innerHTML = `<img src="${IMG_URL}${item.poster_path}" alt="${titulo}">`;
    container.appendChild(card);
  });
}

// 4. TELA DE DETALHES (FILME OU SÉRIE COM TEMPORADAS)
async function abrirDetalhes(tmdbId, tipo) {
  mediaAtualId = tmdbId;
  mediaAtualTipo = tipo;

  const endpoint = tipo === 'tv' ? 'tv' : 'movie';

  try {
    const res = await fetch(`${BASE_URL}/${endpoint}/${tmdbId}?api_key=${API_KEY}&language=pt-BR`);
    const dados = await res.json();

    const modal = document.getElementById("modal-detalhes");
    const titulo = dados.title || dados.name;
    const ano = (dados.release_date || dados.first_air_date || '').split('-')[0];
    const nota = dados.vote_average ? `${dados.vote_average.toFixed(1)} ⭐` : 'N/A';

    document.getElementById("detalhes-backdrop").style.backgroundImage = `url('${ORIGINAL_IMG}${dados.backdrop_path || dados.poster_path}')`;
    document.getElementById("detalhes-titulo").innerText = titulo;
    document.getElementById("detalhes-ano").innerText = ano;
    document.getElementById("detalhes-nota").innerText = nota;
    document.getElementById("detalhes-sinopse").innerText = dados.overview || "Sem sinopse disponível.";

    const secaoTemp = document.getElementById("secao-temporadas");
    const btnPlay = document.getElementById("btn-play-principal");

    if (tipo === 'tv') {
      document.getElementById("detalhes-info-extra").innerText = `${dados.number_of_seasons} Temp. (${dados.number_of_episodes} Ep.)`;
      btnPlay.onclick = () => assistirEpisodio(tmdbId, 1, 1, `${titulo} - T1:E1`);
      
      const select = document.getElementById("select-temporadas");
      select.innerHTML = "";
      dados.seasons.forEach(season => {
        if (season.season_number > 0) {
          select.innerHTML += `<option value="${season.season_number}">${season.name}</option>`;
        }
      });

      secaoTemp.style.display = "block";
      if (dados.seasons.length > 0) {
        carregarEpisodios(select.value || 1);
      }
    } else {
      document.getElementById("detalhes-info-extra").innerText = `${dados.runtime || 0} min`;
      secaoTemp.style.display = "none";
      btnPlay.onclick = () => {
        salvarNoHistorico(tmdbId, titulo, 'filme');
        abrirPlayer(tmdbId, titulo, 'filme');
      };
    }

    modal.style.display = "block";
  } catch (err) {
    console.error("Erro ao carregar detalhes:", err);
  }
}

function fecharDetalhes() {
  const modal = document.getElementById("modal-detalhes");
  if (modal) modal.style.display = "none";
}

// 5. CARREGAR EPISÓDIOS DA TEMPORADA
async function carregarEpisodios(numTemporada) {
  const container = document.getElementById("lista-episodios");
  container.innerHTML = "<p>Carregando episódios...</p>";

  try {
    const res = await fetch(`${BASE_URL}/tv/${mediaAtualId}/season/${numTemporada}?api_key=${API_KEY}&language=pt-BR`);
    const dados = await res.json();

    container.innerHTML = "";
    dados.episodes.forEach(ep => {
      const epCard = document.createElement("div");
      epCard.style.cssText = "display:flex; align-items:center; gap:10px; background:#222; padding:8px; border-radius:6px; cursor:pointer;";
      
      const thumb = ep.still_path ? `${IMG_URL}${ep.still_path}` : 'https://via.placeholder.com/100x60?text=Sem+Foto';
      const tituloSerie = document.getElementById("detalhes-titulo").innerText;

      epCard.onclick = () => assistirEpisodio(mediaAtualId, numTemporada, ep.episode_number, `${tituloSerie} - T${numTemporada}:E${ep.episode_number}`);

      epCard.innerHTML = `
        <img src="${thumb}" style="width:90px; height:55px; object-fit:cover; border-radius:4px;">
        <div>
          <strong style="font-size:0.85rem; display:block; color:#fff;">EP ${ep.episode_number}: ${ep.name}</strong>
          <span style="font-size:0.75rem; color:#aaa;">${ep.runtime ? ep.runtime + ' min' : ''}</span>
        </div>
      `;
      container.appendChild(epCard);
    });
  } catch (err) {
    console.error("Erro ao buscar episódios:", err);
    container.innerHTML = "<p>Erro ao carregar episódios.</p>";
  }
}

function assistirEpisodio(tmdbId, temporada, episodio, tituloExibicao) {
  salvarNoHistorico(tmdbId, tituloExibicao, 'tv');
  const endpointEspecial = `serie/${tmdbId}/${temporada}/${episodio}`;
  abrirPlayerCustom(endpointEspecial, tituloExibicao);
}

// 6. PLAYER DE VÍDEO EMBED
function abrirPlayer(tmdbId, titulo, tipo = 'filme') {
  const endpointTipo = (tipo === 'tv' || tipo === 'serie') ? 'serie' : 'filme';
  abrirPlayerCustom(`${endpointTipo}/${tmdbId}`, titulo);
}

function abrirPlayerCustom(caminhoEmbed, titulo) {
  let modal = document.getElementById("modal-player");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modal-player";
    document.body.appendChild(modal);
  }

  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: #000; display: flex; flex-direction: column;
    justify-content: center; align-items: center; z-index: 9999;
  `;

  const playerUrl = `${SUPERFLIX_URL}/${caminhoEmbed}`;

  modal.innerHTML = `
    <div style="position: absolute; top: 10px; left: 15px; right: 15px; display: flex; justify-content: space-between; align-items: center; z-index: 10000; pointer-events: auto;">
      <h3 style="color: #fff; font-size: 0.9rem; text-shadow: 1px 1px 3px #000; background: rgba(0,0,0,0.6); padding: 4px 10px; border-radius: 4px; margin: 0;">🎬 ${titulo}</h3>
      <button onclick="fecharPlayer()" style="background: #E50914; color: white; border: none; padding: 6px 14px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.85rem; box-shadow: 0 2px 5px rgba(0,0,0,0.5);">Sair X</button>
    </div>

    <div style="width: 100%; height: 100%; position: relative; background: #000;">
      <iframe 
        id="iframe-player"
        src="${playerUrl}" 
        style="width: 100%; height: 100%; border: none;" 
        allow="autoplay; fullscreen; encrypted-media"
        allowfullscreen 
        sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
        scrolling="no">
      </iframe>
    </div>
  `;

  modal.style.display = "flex";

  // Previne que a sua página principal seja redirecionada
  window.onbeforeunload = function () {
    return "Deseja realmente sair?";
  };

  // Entra em Tela Cheia
  if (modal.requestFullscreen) {
    modal.requestFullscreen().catch(() => {});
  } else if (modal.webkitRequestFullscreen) {
    modal.webkitRequestFullscreen();
  }

  // Trava na horizontal
  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock("landscape").catch(() => {});
  }
}




function fecharPlayer() {
  const modal = document.getElementById("modal-player");
  if (modal) {
    modal.innerHTML = "";
    modal.style.display = "none";
    window.onbeforeunload = null;
  }

  // Sai do modo tela cheia do navegador
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }

  // Destrava a rotação de tela no celular
  if (screen.orientation && screen.orientation.unlock) {
    screen.orientation.unlock();
  }
}


// 7. HISTÓRICO LOCAL
function salvarNoHistorico(id, titulo, tipo) {
  let historico = JSON.parse(localStorage.getItem("cineflix_historico") || "[]");
  historico = historico.filter(item => item.id !== id || item.titulo !== titulo);
  historico.unshift({ id, titulo, tipo, data: new Date().toLocaleDateString('pt-BR') });
  
  if (historico.length > 20) historico.pop();
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

// 8. CANAIS ESPORTIVOS
// ============================================================================
// 8. TELA DE CANAIS ESPORTIVOS & EVENTOS AO VIVO (INTEGRAÇÃO COM API SUPERFLIX)
// ============================================================================

// ============================================================================
// 8. TELA DE CANAIS ESPORTIVOS & EVENTOS AO VIVO (COM CORREÇÃO DE CORS)
// ============================================================================

// Usamos um Proxy CORS para contornar o bloqueio do navegador na Vercel
// ============================================================================
// 8. TELA DE CANAIS ESPORTIVOS & EVENTOS AO VIVO
// ============================================================================

// ============================================================================
// 8. TELA DE CANAIS ESPORTIVOS & IFRAME BÁSICO
// ============================================================================

const CANAIS_ESPN = [
  { title: "ESPN HD", modalidade: "ESPN / Star+", play_event_url: "https://rdcanais.net/espn", status: "AO VIVO" },
  { title: "ESPN 2 HD", modalidade: "ESPN / Star+", play_event_url: "https://rdcanais.net/espn2", status: "AO VIVO" },
  { title: "ESPN 3 HD", modalidade: "ESPN / Star+", play_event_url: "https://rdcanais.net/espn3", status: "AO VIVO" },
  { title: "ESPN 4 HD", modalidade: "ESPN / Star+", play_event_url: "https://rdcanais.net/espn4", status: "AO VIVO" },
  { title: "ESPN 5 HD", modalidade: "ESPN / Star+", play_event_url: "https://rdcanais.net/espn5", status: "AO VIVO" },
  { title: "ESPN 6 HD", modalidade: "ESPN / Star+", play_event_url: "https://rdcanais.net/espn6", status: "AO VIVO" }
];

const CANAIS_PARAMOUNT = [
  { title: "Paramount+ HD", modalidade: "Libertadores / Sul-Americana", play_event_url: "https://rdcanais.net/paramountplus", status: "AO VIVO" },
  { title: "Paramount+ 2 HD", modalidade: "Libertadores / Sul-Americana", play_event_url: "https://rdcanais.net/paramountplus2", status: "AO VIVO" },
  { title: "Paramount+ 3 HD", modalidade: "Libertadores / Sul-Americana", play_event_url: "https://rdcanais.net/paramountplus3", status: "AO VIVO" },
  { title: "Paramount+ 4 HD", modalidade: "Libertadores / Sul-Americana", play_event_url: "https://rdcanais.net/paramountplus4", status: "AO VIVO" }
];

const CANAIS_PREMIERE = [
  { title: "Premiere Clubes HD", modalidade: "Brasileirão / Estaduais", play_event_url: "https://rdcanais.net/premiereclubes", status: "AO VIVO" },
  { title: "Premiere 2 HD", modalidade: "Brasileirão / Estaduais", play_event_url: "https://rdcanais.net/premiere2", status: "AO VIVO" },
  { title: "Premiere 3 HD", modalidade: "Brasileirão / Estaduais", play_event_url: "https://rdcanais.net/premiere3", status: "AO VIVO" },
  { title: "Premiere 4 HD", modalidade: "Brasileirão / Estaduais", play_event_url: "https://rdcanais.net/premiere4", status: "AO VIVO" },
  { title: "Premiere 5 HD", modalidade: "Brasileirão / Estaduais", play_event_url: "https://rdcanais.net/premiere5", status: "AO VIVO" },
  { title: "Premiere 6 HD", modalidade: "Brasileirão / Estaduais", play_event_url: "https://rdcanais.net/premiere6", status: "AO VIVO" },
  { title: "Premiere 7 HD", modalidade: "Brasileirão / Estaduais", play_event_url: "https://rdcanais.net/premiere7", status: "AO VIVO" },
  { title: "Premiere 8 HD", modalidade: "Brasileirão / Estaduais", play_event_url: "https://rdcanais.net/premiere8", status: "AO VIVO" }
];

const CANAIS_MAX = [
  { title: "Max 1 HD", modalidade: "Champions League / Max", play_event_url: "https://v1.rdse.lol/max1", status: "AO VIVO" },
  { title: "Max 2 HD", modalidade: "Champions League / Max", play_event_url: "https://v1.rdse.lol/max2", status: "AO VIVO" },
  { title: "Max 3 HD", modalidade: "Champions League / Max", play_event_url: "https://v1.rdse.lol/max3", status: "AO VIVO" },
  { title: "Max 4 HD", modalidade: "Champions League / Max", play_event_url: "https://v1.rdse.lol/max4", status: "AO VIVO" },
  { title: "Max 5 HD", modalidade: "Champions League / Max", play_event_url: "https://v1.rdse.lol/max5", status: "AO VIVO" },
  { title: "Max 6 HD", modalidade: "Champions League / Max", play_event_url: "https://v1.rdse.lol/max6", status: "AO VIVO" },
  { title: "Max 7 HD", modalidade: "Champions League / Max", play_event_url: "https://v1.rdse.lol/max7", status: "AO VIVO" }
];

const TODOS_OS_CANAIS = [
  ...CANAIS_ESPN,
  ...CANAIS_PARAMOUNT,
  ...CANAIS_PREMIERE,
  ...CANAIS_MAX
];

// Função que abre a URL no Iframe Básico
// Função que abre a URL no Iframe Básico na Horizontal com Sandbox Anti-Ads
function abrirIframeBasico(url, titulo) {
  let modal = document.getElementById("modal-iframe-basico");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modal-iframe-basico";
    document.body.appendChild(modal);
  }

  // Ocupa 100% da tela do aparelho
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: #000; display: flex; flex-direction: column;
    justify-content: center; align-items: center; z-index: 99999;
  `;

  modal.innerHTML = `
    <!-- Topo Flutuante com Botão Sair -->
    <div style="position: absolute; top: 10px; left: 15px; right: 15px; display: flex; justify-content: space-between; align-items: center; z-index: 100000; pointer-events: auto;">
      <span style="color: #fff; font-size: 0.85rem; font-weight: bold; background: rgba(0,0,0,0.7); padding: 4px 10px; border-radius: 4px;">📺 ${titulo}</span>
      <button onclick="fecharIframeBasico()" style="background: #e50914; color: #fff; border: none; padding: 6px 14px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.85rem; box-shadow: 0 2px 5px rgba(0,0,0,0.5);">Sair X</button>
    </div>

    <!-- Container em Horizontal Cheia (100% de largura e altura) -->
    <div style="position: relative; width: 100%; height: 100%; overflow: hidden; background: #000;">
      <iframe 
        src="${url}" 
        title="${titulo}" 
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" 
        allowfullscreen 
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        sandbox="allow-scripts allow-same-origin allow-forms allow-presentation">
      </iframe>
    </div>
  `;

  modal.style.display = "flex";

  // Força Modo Tela Cheia
  if (modal.requestFullscreen) {
    modal.requestFullscreen().catch(() => {});
  } else if (modal.webkitRequestFullscreen) {
    modal.webkitRequestFullscreen();
  }

  // Trava a Orientação na Horizontal em Celulares
  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock("landscape").catch(() => {});
  }
}

function fecharIframeBasico() {
  const modal = document.getElementById("modal-iframe-basico");
  if (modal) {
    modal.innerHTML = "";
    modal.style.display = "none";
  }

  // Sai do Modo Tela Cheia
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }

  // Destrava a orientação de tela do celular
  if (screen.orientation && screen.orientation.unlock) {
    screen.orientation.unlock();
  }
}


function abrirCanaisEsportivos() {
  const modal = document.getElementById("modal-esportes");
  if (modal) {
    modal.style.display = "block";
    carregarEventosEsportivos();
  }
}

function fecharEsportes() {
  const modal = document.getElementById("modal-esportes");
  if (modal) modal.style.display = "none";
}

function carregarEventosEsportivos() {
  const grid = document.getElementById("grid-esportes");
  if (!grid) return;

  grid.innerHTML = "";

  TODOS_OS_CANAIS.forEach(canal => {
    const card = document.createElement("div");
    card.style.cssText = `
      background: #18222d; border-radius: 10px; padding: 12px 15px;
      display: flex; justify-content: space-between; align-items: center;
      cursor: pointer; border: 1px solid #283747; transition: transform 0.2s, border-color 0.2s;
    `;

    card.onmouseover = () => { card.style.borderColor = "#22c55e"; card.style.transform = "translateY(-2px)"; };
    card.onmouseout = () => { card.style.borderColor = "#283747"; card.style.transform = "translateY(0)"; };

    card.onclick = () => {
      fecharEsportes();
      abrirIframeBasico(canal.play_event_url, canal.title);
    };

    let icone = "⚽";
    if (canal.title.includes("ESPN")) icone = "📺";
    if (canal.title.includes("Paramount")) icone = "🎬";
    if (canal.title.includes("Max")) icone = "🏆";

    card.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px;">
        <div style="background:#0f172a; width:40px; height:40px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:1.2rem; border:1px solid #1e293b;">
          ${icone}
        </div>
        <div>
          <strong style="color:#fff; font-size:0.85rem; display:block;">${canal.title}</strong>
          <span style="font-size:0.75rem; color:#64748b;">${canal.modalidade}</span>
        </div>
      </div>
      <span style="background:#ef4444; color:#fff; font-size:0.65rem; padding:4px 8px; border-radius:4px; font-weight:bold;">
        ${canal.status}
      </span>
    `;

    grid.appendChild(card);
  });
}



// 9. BUSCA MULTI-MÍDIA
// ============================================================================
// SISTEMA DE BUSCA EM TELA EXCLUSIVA
// ============================================================================

async function buscarMidia(event) {
  const input = document.getElementById("input-busca");
  if (!input) return;

  const termo = input.value.trim();

  // Permite disparar se o usuário pressionar Enter ou se for um clique no botão
  if (event && event.type === "keyup" && event.key !== "Enter") return;
  if (!termo) return;

  // Fecha o teclado em dispositivos móveis
  input.blur();

  abrirTelaBusca(termo);
}

async function abrirTelaBusca(termo) {
  let modalBusca = document.getElementById("modal-busca-exclusiva");

  // Se a tela/modal de busca ainda não existir no HTML, cria dinamicamente
  if (!modalBusca) {
    modalBusca = document.createElement("div");
    modalBusca.id = "modal-busca-exclusiva";
    modalBusca.style.cssText = `
      position: fixed; inset: 0; background: #141414; z-index: 3000;
      overflow-y: auto; padding: 20px; display: none;
    `;
    document.body.appendChild(modalBusca);
  }

  // Estrutura o cabeçalho e a grade da nova tela
  modalBusca.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #333; padding-bottom: 10px;">
      <h2 style="color: #fff; font-size: 1.2rem; margin: 0;">
        Resultados para: <span style="color: #E50914;">"${termo}"</span>
      </h2>
      <button onclick="fecharTelaBusca()" style="background: #E50914; color: white; border: none; padding: 6px 14px; border-radius: 4px; font-weight: bold; cursor: pointer;">
        Sair X
      </button>
    </div>
    <div id="grid-resultados-busca" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 12px;">
      <p style="color: #aaa; grid-column: 1/-1; text-align: center; padding: 40px;">Buscando conteúdos...</p>
    </div>
  `;

  modalBusca.style.display = "block";

  try {
    const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(termo)}&language=pt-BR`);
    const data = await res.json();
    
    // Filtra apenas filmes e séries que possuam capa
    const resultados = (data.results || []).filter(item => (item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path);
    renderizarGridBusca(resultados);

  } catch (error) {
    console.error("Erro na busca:", error);
    const grid = document.getElementById("grid-resultados-busca");
    if (grid) grid.innerHTML = `<p style="color: #ef4444; grid-column: 1/-1; text-align: center;">Erro ao carregar resultados.</p>`;
  }
}

function renderizarGridBusca(lista) {
  const container = document.getElementById("grid-resultados-busca");
  if (!container) return;

  if (lista.length === 0) {
    container.innerHTML = `<p style="color: #aaa; grid-column: 1/-1; text-align: center; padding: 40px;">Nenhum título encontrado.</p>`;
    return;
  }

  container.innerHTML = "";

  lista.forEach(item => {
    const card = document.createElement("div");
    card.style.cssText = `
      cursor: pointer; transition: transform 0.2s; border-radius: 4px; overflow: hidden; background: #222;
    `;

    const titulo = item.title || item.name || "Sem título";
    const capa = `${IMG_URL}${item.poster_path}`;
    const tipo = item.media_type === 'tv' ? 'SÉRIE' : 'FILME';

    // Ao clicar num item da busca, fecha a tela e abre a sinopse/detalhes
    card.onclick = () => {
      fecharTelaBusca();
      abrirDetalhes(item.id, item.media_type);
    };

    card.innerHTML = `
      <div style="position: relative; aspect-ratio: 2/3;">
        <img src="${capa}" alt="${titulo}" style="width: 100%; height: 100%; object-fit: cover;">
        <span style="position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.8); color: #22c55e; font-size: 0.6rem; padding: 2px 4px; border-radius: 3px; font-weight: bold;">
          ${tipo}
        </span>
      </div>
      <p style="color: #fff; font-size: 0.75rem; padding: 5px; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${titulo}</p>
    `;

    container.appendChild(card);
  });
}

function fecharTelaBusca() {
  const modal = document.getElementById("modal-busca-exclusiva");
  if (modal) modal.style.display = "none";
}

function toggleBusca() {
  const bar = document.getElementById("search-bar");
  if (bar) bar.classList.toggle("active");
}


document.addEventListener("DOMContentLoaded", carregarCatalogos);
