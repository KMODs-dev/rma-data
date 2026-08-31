const API_KEY = "49db2cc8a1837ae6780e02e8faf78b83"; // Cole sua chave do API-Sports aqui
const TEAM_ID = 541; // ID do Real Madrid
const SEASON = 2026; // Temporada atual

// Armazena dados dos jogadores localmente para reuso no Modal
let jogadoresMemoria = [];

async function carregarDados() {
  const containerJogadores = document.getElementById("jogadores-grid");
  const containerPartidas = document.getElementById("partidas-grid");

  const headers = {
    "x-apisports-key": API_KEY
  };

  // 1. CARREGAR ELENCO E ESTATÍSTICAS DOS JOGADORES (API-Football)
  try {
    const res = await fetch(`https://v3.football.api-sports.io/players?team=${TEAM_ID}&season=${SEASON}`, {
      method: "GET",
      headers: headers
    });
    
    const data = await res.json();

    if (data.response && data.response.length > 0) {
      jogadoresMemoria = data.response;
      containerJogadores.innerHTML = "";

      jogadoresMemoria.forEach((item, index) => {
        const player = item.player;
        const stats = item.statistics[0] || {};

        const foto = player.photo || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=300&q=80';
        const posicao = traduzirPosicao(stats.games?.position || player.position);
        const numero = stats.games?.number ? `#${stats.games.number}` : '-';

        containerJogadores.innerHTML += `
          <div class="card" onclick="abrirModalEstatisticas(${index})" style="cursor: pointer;">
            <div class="card-header">
              <span class="number">${numero}</span>
              <span class="position">${posicao}</span>
            </div>
            <img src="${foto}" class="player-img" alt="${player.name}" style="object-fit: contain; background: #1a2332; height: 180px; width: 100%;">
            <div class="card-body">
              <h3>${player.name}</h3>
              <p class="country">${player.nationality || 'Internacional'} • ${player.age} anos</p>
              <div class="stats" style="display:flex; justify-content:space-between; margin-top:8px; font-size:0.8rem; color:#e5b324; background:#141b27; padding:6px 10px; border-radius:4px;">
                <span>⚽ ${stats.goals?.total || 0} Gols</span>
                <span>👟 ${stats.goals?.assists || 0} Assis</span>
              </div>
              <p style="font-size:0.75rem; color:#a0aec0; margin-top:8px; text-align:center;">🔍 Clique para estatísticas completas</p>
            </div>
          </div>
        `;
      });
    } else {
      containerJogadores.innerHTML = "<p>Nenhum jogador encontrado para esta temporada.</p>";
    }
  } catch (error) {
    console.error("Erro ao carregar elenco:", error);
    containerJogadores.innerHTML = "<p>Erro ao conectar com a API de jogadores.</p>";
  }

  // 2. CARREGAR PRÓXIMAS PARTIDAS DO REAL MADRID
  try {
    const resPartidas = await fetch(`https://v3.football.api-sports.io/fixtures?team=${TEAM_ID}&next=5`, {
      method: "GET",
      headers: headers
    });
    
    const dadosPartidas = await resPartidas.json();

    if (dadosPartidas.response && dadosPartidas.response.length > 0) {
      containerPartidas.innerHTML = "";

      dadosPartidas.response.forEach(item => {
        const fixture = item.fixture;
        const league = item.league;
        const teams = item.teams;

        const dataFormatada = new Date(fixture.date).toLocaleDateString('pt-BR', {
          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
        });

        containerPartidas.innerHTML += `
          <div class="card" style="padding: 15px; text-align: center;">
            <p style="color: #e5b324; font-size: 0.8rem; margin-bottom: 5px;">🏆 ${league.name}</p>
            <h3 style="margin-bottom: 10px; font-size: 1rem;">${teams.home.name} <br><span style="color:#e5b324;">VS</span><br> ${teams.away.name}</h3>
            <p style="color: #a0aec0; font-size: 0.85rem;">📅 ${dataFormatada}</p>
            <p style="color: #a0aec0; font-size: 0.85rem;">🏟️ ${fixture.venue.name || 'Estádio'}</p>
          </div>
        `;
      });
    } else {
      containerPartidas.innerHTML = "<p>Nenhuma partida agendada encontrada no momento.</p>";
    }
  } catch (error) {
    console.error("Erro ao carregar partidas:", error);
    containerPartidas.innerHTML = "<p>Erro ao conectar com a API de partidas.</p>";
  }
}

// 3. JANELA MODAL PARA EXIBIR ESTATÍSTICAS DETALHADAS
function abrirModalEstatisticas(index) {
  const item = jogadoresMemoria[index];
  if (!item) return;

  const p = item.player;
  const s = item.statistics[0] || {};

  let modal = document.getElementById("modal-jogador");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modal-jogador";
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.85); display: flex; justify-content: center;
      align-items: center; z-index: 1000; padding: 15px;
    `;
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div style="background: #141b27; border: 1px solid #e5b324; border-radius: 12px; width: 100%; max-width: 480px; padding: 20px; color: white; position: relative;">
      <button onclick="fecharModal()" style="position: absolute; top: 10px; right: 15px; background: none; border: none; color: #a0aec0; font-size: 1.5rem; cursor: pointer;">&times;</button>
      
      <div style="display: flex; align-items: center; gap: 15px; border-bottom: 1px solid #2d3748; padding-bottom: 15px;">
        <img src="${p.photo}" style="width: 80px; height: 80px; object-fit: contain; background: #1a2332; border-radius: 50%; border: 2px solid #e5b324;">
        <div>
          <h2 style="margin:0; font-size: 1.3rem;">${p.name}</h2>
          <p style="color: #e5b324; margin: 3px 0; font-size: 0.9rem;">${traduzirPosicao(s.games?.position || p.position)}</p>
          <p style="color: #a0aec0; margin: 0; font-size: 0.8rem;">${p.nationality} | ${p.age} Anos</p>
        </div>
      </div>

      <h4 style="margin: 15px 0 10px 0; color: #e5b324; text-align: center;">📊 Raio-X na Temporada (${SEASON})</h4>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div style="background: #1a2332; padding: 10px; border-radius: 6px; text-align: center;">
          <span style="font-size: 0.75rem; color: #a0aec0;">Partidas</span>
          <h3 style="margin: 5px 0 0 0; color: #fff;">${s.games?.appearences || 0}</h3>
        </div>
        <div style="background: #1a2332; padding: 10px; border-radius: 6px; text-align: center;">
          <span style="font-size: 0.75rem; color: #a0aec0;">Minutos Jogados</span>
          <h3 style="margin: 5px 0 0 0; color: #fff;">${s.games?.minutes || 0}'</h3>
        </div>
        <div style="background: #1a2332; padding: 10px; border-radius: 6px; text-align: center;">
          <span style="font-size: 0.75rem; color: #a0aec0;">Gols Marcados</span>
          <h3 style="margin: 5px 0 0 0; color: #e5b324;">⚽ ${s.goals?.total || 0}</h3>
        </div>
        <div style="background: #1a2332; padding: 10px; border-radius: 6px; text-align: center;">
          <span style="font-size: 0.75rem; color: #a0aec0;">Assistências</span>
          <h3 style="margin: 5px 0 0 0; color: #e5b324;">👟 ${s.goals?.assists || 0}</h3>
        </div>
        <div style="background: #1a2332; padding: 10px; border-radius: 6px; text-align: center;">
          <span style="font-size: 0.75rem; color: #a0aec0;">Passes Chave</span>
          <h3 style="margin: 5px 0 0 0; color: #38a169;">🎯 ${s.passes?.key || 0}</h3>
        </div>
        <div style="background: #1a2332; padding: 10px; border-radius: 6px; text-align: center;">
          <span style="font-size: 0.75rem; color: #a0aec0;">Nota Média</span>
          <h3 style="margin: 5px 0 0 0; color: #3182ce;">⭐ ${s.games?.rating ? parseFloat(s.games.rating).toFixed(1) : 'N/A'}</h3>
        </div>
      </div>
    </div>
  `;
  modal.style.display = "flex";
}

function fecharModal() {
  const modal = document.getElementById("modal-jogador");
  if (modal) modal.style.display = "none";
}

// Função de tradução de posições
function traduzirPosicao(posicao) {
  if (!posicao) return 'Jogador';
  if (posicao.includes('Goalkeeper') || posicao === 'G') return 'Goleiro';
  if (posicao.includes('Defender') || posicao === 'D') return 'Defensor';
  if (posicao.includes('Midfielder') || posicao === 'M') return 'Meio-Campista';
  if (posicao.includes('Attacker') || posicao === 'F') return 'Atacante';
  return posicao;
}

document.addEventListener("DOMContentLoaded", carregarDados);
