// Chave de testes pública do TMDb (perfeita para fins educativos)
const API_KEY = "19d45d1a9f76411b2add29c8811c6bf1";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/w500";

// Carrega os filmes em alta assim que a página abre
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

// Renderiza a lista de cards no HTML
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
      <div class="card" onclick="exibirDetalhes('${filme.title}', '${filme.overview.replace(/'/g, "\\'")}', '${nota}')">
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

// Busca filmes dinamicamente pelo nome
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

// Exibe um alerta simples com a sinopse ao clicar no card (pode ser melhorado para modal depois)
function exibirDetalhes(titulo, sinopse, nota) {
  alert(`🎬 ${titulo}\n\n⭐ Nota: ${nota}/10\n\n📝 Sinopse:\n${sinopse || 'Sinopse não disponível.'}`);
}

// Executa ao carregar o DOM
document.addEventListener("DOMContentLoaded", carregarFilmesEmAlta);
