const API_KEY = '44d0e520c0d14303bff117bd7b2062c4'; // Cole sua chave do football-data.org aqui
const TEAM_ID = 86; // ID do Real Madrid no Football-Data

async function carregarDados() {
  const containerJogadores = document.getElementById("jogadores-grid");
  const containerPartidas = document.getElementById("partidas-grid");

  const headers = { 'X-Auth-Token': API_KEY };

  // 1. CARREGAR ELENCO E JOGADORES
  try {
    const resElenco = await fetch(`https://api.football-data.org/v4/teams/${TEAM_ID}`, { headers });
    const dadosElenco = await resElenco.json();

    if (dadosElenco.squad) {
      containerJogadores.innerHTML = "";

      dadosElenco.squad.forEach(jogador => {
        // Calcula a idade do jogador
        const anoNascimento = new Date(jogador.dateOfBirth).getFullYear();
        const idade = new Date().getFullYear() - anoNascimento;

        // Foto padrão (já que a API gratuita não retorna foto de cada jogador)
        const fotoPadrao = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=300&q=80';

        containerJogadores.innerHTML += `
          <div class="card">
            <div class="card-header">
              <span class="number">#</span>
              <span class="position">${traduzirPosicao(jogador.position)}</span>
            </div>
            <img src="${fotoPadrao}" class="player-img" alt="${jogador.name}">
            <div class="card-body">
              <h3>${jogador.name}</h3>
              <p class="country">${jogador.nationality} • ${idade} anos</p>
            </div>
          </div>
        `;
      });
    }
  } catch (error) {
    console.error("Erro ao buscar elenco:", error);
    containerJogadores.innerHTML = "<p>Erro ao carregar o elenco do Real Madrid.</p>";
  }

  // 2. CARREGAR PRÓXIMAS PARTIDAS
  try {
    const resPartidas = await fetch(`https://api.football-data.org/v4/teams/${TEAM_ID}/matches?status=SCHEDULED&limit=5`, { headers });
    const dadosPartidas = await resPartidas.json();

    if (dadosPartidas.matches && dadosPartidas.matches.length > 0) {
      containerPartidas.innerHTML = "";

      dadosPartidas.matches.forEach(partida => {
        const dataFormatada = new Date(partida.utcDate).toLocaleDateString('pt-BR', {
          day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
        });

        const timeCasa = partida.homeTeam.name;
        const timeFora = partida.awayTeam.name;
        const competicao = partida.competition.name;

        containerPartidas.innerHTML += `
          <div class="card" style="padding: 15px; text-align: center;">
            <p style="color: #e5b324; font-size: 0.8rem; margin-bottom: 5px;">🏆 ${competicao}</p>
            <h3 style="margin-bottom: 10px; font-size: 1rem;">${timeCasa} <br><span style="color:#e5b324;">VS</span><br> ${timeFora}</h3>
            <p style="color: #a0aec0; font-size: 0.85rem;">📅 ${dataFormatada}</p>
          </div>
        `;
      });
    } else {
      containerPartidas.innerHTML = "<p>Nenhuma partida agendada encontrada no momento.</p>";
    }
  } catch (error) {
    console.error("Erro ao buscar partidas:", error);
    containerPartidas.innerHTML = "<p>Erro ao carregar próximas partidas.</p>";
  }
}

// Função para traduzir as posições da API que vêm em inglês
function traduzirPosicao(posicao) {
  switch (posicao) {
    case 'Goalkeeper': return 'Goleiro';
    case 'Defence': return 'Defensor';
    case 'Midfield': return 'Meio-Campista';
    case 'Offence': return 'Atacante';
    default: return 'Jogador';
  }
}

document.addEventListener("DOMContentLoaded", carregarDados);
