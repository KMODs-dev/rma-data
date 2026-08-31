const API_KEY = "49db2cc8a1837ae6780e02e8faf78b83"; // Cole sua chave exata aqui
const TEAM_ID = 541; // ID do Real Madrid

let jogadoresMemoria = [];

async function carregarDados() {
  const containerJogadores = document.getElementById("jogadores-grid");
  const containerPartidas = document.getElementById("partidas-grid");

  const headers = {
    "x-apisports-key": API_KEY
  };

  // 1. CARREGAR ELENCO COMPLETO (Endpoint leve do plano gratuito)
  try {
    const res = await fetch(`https://v3.football.api-sports.io/players/squads?team=${TEAM_ID}`, {
      method: "GET",
      headers: headers
    });
    
    const data = await res.json();

    // Verificação de erros na API (ex: chave inválida ou limite excedido)
    if (data.errors && Object.keys(data.errors).length > 0) {
      const msgErro = JSON.stringify(data.errors);
      containerJogadores.innerHTML = `<p style="color:#e53e3e;">Erro da API: ${msgErro}</p>`;
      return;
    }

    if (data.response && data.response.length > 0 && data.response[0].players) {
      jogadoresMemoria = data.response[0].players;
      containerJogadores.innerHTML = "";

      jogadoresMemoria.forEach((player, index) => {
        const foto = player.photo || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=300&q=80';
        const posicao = traduzirPosicao(player.position);
        const numero = player.number ? `#${player.number}` : '-';

        containerJogadores.innerHTML += `
          <div class="card" onclick="abrirModalEstatisticas(${index})" style="cursor: pointer;">
            <div class="card-header">
              <span class="number">${numero}</span>
              <span class="position">${posicao}</span>
            </div>
            <img src="${foto}" class="player-img" alt="${player.name}" style="object-fit: contain; background: #1a2332; height: 180px; width: 100%;">
            <div class="card-body">
              <h3>${player.name}</h3>
              <p class="country">Idade: ${player.age || 'N/A'}</p>
              <p style="font-size:0.75rem; color:#e5b324; margin-top:8px; text-align:center;">🔍 Clique para ver o perfil</p>
            </div>
          </div>
        `;
      });
    } else {
      containerJogadores.innerHTML = "<p>Nenhum jogador retornado pela API.</p>";
    }
  } catch (error) {
    console.error("Erro ao carregar elenco:", error);
    containerJogadores.innerHTML = "<p style='color:#e53e3e;'>Erro ao conectar com a API de jogadores.</p>";
  }

  // 2. CARREGAR PRÓXIMAS PARTIDAS
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
            <p style="color: #a0aec0; font-size: 0.85rem;">🏟️ ${fixture.venue?.name || 'Estádio'}</p>
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

// 3. JANELA MODAL PARA DETALHES
function abrirModalEstatisticas(index) {
  const p = jogadoresMemoria[index];
  if (!p) return;

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
    <div style="background: #141b27; border: 1px solid #e5b324; border-radius: 12px; width: 100%; max-width: 400px; padding: 20px; color: white; position: relative; text-align: center;">
      <button onclick="fecharModal()" style="position: absolute; top: 10px; right: 15px; background: none; border: none; color: #a0aec0; font-size: 1.5rem; cursor: pointer;">&times;</button>
      
      <img src="${p.photo}" style="width: 100px; height: 100px; object-fit: contain; background: #1a2332; border-radius: 50%; border: 2px solid #e5b324; margin-bottom: 10px;">
      <h2 style="margin:0; font-size: 1.3rem;">${p.name}</h2>
      <p style="color: #e5b324; margin: 5px 0; font-size: 0.9rem;">${traduzirPosicao(p.position)} #${p.number || '-'}</p>
      <p style="color: #a0aec0; margin: 0; font-size: 0.85rem;">Idade: ${p.age || 'N/A'} anos</p>
    </div>
  `;
  modal.style.display = "flex";
}

function fecharModal() {
  const modal = document.getElementById("modal-jogador");
  if (modal) modal.style.display = "none";
}

function traduzirPosicao(posicao) {
  if (!posicao) return 'Jogador';
  if (posicao.includes('Goalkeeper')) return 'Goleiro';
  if (posicao.includes('Defender')) return 'Defensor';
  if (posicao.includes('Midfielder')) return 'Meio-Campista';
  if (posicao.includes('Attacker')) return 'Atacante';
  return posicao;
}

document.addEventListener("DOMContentLoaded", carregarDados);
