// ID do Real Madrid na API TheSportsDB
const TEAM_ID = "133738";

async function carregarDados() {
  const containerJogadores = document.getElementById("jogadores-grid");
  const containerPartidas = document.getElementById("partidas-grid");

  // 1. BUSCAR ELENCO REAL DO REAL MADRID
  try {
    const resElenco = await fetch(`https://www.thesportsdb.com/api/v1/json/3/lookup_all_players.php?id=${TEAM_ID}`);
    const dadosElenco = await resElenco.json();

    if (dadosElenco.player && dadosElenco.player.length > 0) {
      containerJogadores.innerHTML = "";

      dadosElenco.player.forEach(jogador => {
        // Usa a foto do jogador ou uma imagem genérica caso não tenha
        const foto = jogador.strCutout || jogador.strThumb || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=300&q=80';
        const posicao = traduzirPosicao(jogador.strPosition);
        const numero = jogador.strNumber ? `#${jogador.strNumber}` : '-';

        containerJogadores.innerHTML += `
          <div class="card">
            <div class="card-header">
              <span class="number">${numero}</span>
              <span class="position">${posicao}</span>
            </div>
            <img src="${foto}" class="player-img" alt="${jogador.strPlayer}" style="object-fit: contain; background: #1a2332;">
            <div class="card-body">
              <h3>${jogador.strPlayer}</h3>
              <p class="country">${jogador.strNationality || 'Internacional'}</p>
              <div class="stats" style="display:flex; justify-content:space-between; margin-top:8px; font-size:0.8rem; color:#e5b324; background:#141b27; padding:5px 8px; border-radius:4px;">
                <span>📍 ${jogador.strHeight || 'N/A'}</span>
                <span>⚽ ${jogador.strTeam}</span>
              </div>
            </div>
          </div>
        `;
      });
    } else {
      containerJogadores.innerHTML = "<p>Nenhum jogador encontrado.</p>";
    }
  } catch (error) {
    console.error("Erro ao carregar elenco:", error);
    containerJogadores.innerHTML = "<p>Erro ao conectar com a API de jogadores.</p>";
  }

  // 2. BUSCAR PRÓXIMAS PARTIDAS DO REAL MADRID
  try {
    const resPartidas = await fetch(`https://www.thesportsdb.com/api/v1/json/3/eventsnext.php?id=${TEAM_ID}`);
    const dadosPartidas = await resPartidas.json();

    if (dadosPartidas.events && dadosPartidas.events.length > 0) {
      containerPartidas.innerHTML = "";

      dadosPartidas.events.forEach(partida => {
        containerPartidas.innerHTML += `
          <div class="card" style="padding: 15px; text-align: center;">
            <p style="color: #e5b324; font-size: 0.8rem; margin-bottom: 5px;">🏆 ${partida.strLeague}</p>
            <h3 style="margin-bottom: 10px; font-size: 1rem;">${partida.strHomeTeam} <br><span style="color:#e5b324;">VS</span><br> ${partida.strAwayTeam}</h3>
            <p style="color: #a0aec0; font-size: 0.85rem;">📅 ${partida.dateEvent} às ${partida.strTime || '16:00'}</p>
            <p style="color: #a0aec0; font-size: 0.85rem;">🏟️ ${partida.strVenue || 'Estádio'}</p>
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

// Função para traduzir as posições em inglês
function traduzirPosicao(posicao) {
  if (!posicao) return 'Jogador';
  if (posicao.includes('Goalkeeper')) return 'Goleiro';
  if (posicao.includes('Defender') || posicao.includes('Back')) return 'Defensor';
  if (posicao.includes('Midfield')) return 'Meio-Campista';
  if (posicao.includes('Forward') || posicao.includes('Winger') || posicao.includes('Striker')) return 'Atacante';
  return posicao;
}

document.addEventListener("DOMContentLoaded", carregarDados);
