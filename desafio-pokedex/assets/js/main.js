const pokemonList = document.getElementById('pokemonList')
const loadMoreButton = document.getElementById('loadMoreButton')
const searchInput = document.getElementById('searchInput')
const searchButton = document.getElementById('searchButton')

const maxRecords = 151
const limit = 12
let offset = 0

function convertPokemonToLi(pokemon) {
  return `
    <li class="pokemon ${pokemon.type}">
      <span class="number">#${pokemon.number}</span>
      <span class="name">${pokemon.name}</span>
      <div class="detail">
        <ol class="types">
          ${pokemon.types.map(type => `<li class="type ${type}">${type}</li>`).join('')}
        </ol>
        <img src="${pokemon.photo}" alt="${pokemon.name}">
      </div>
    </li>
  `
}

async function loadPokemonItens(offset, limit) {
  const pokemons = await pokeApi.getPokemons(offset, limit)
  pokemonList.innerHTML += pokemons.map(convertPokemonToLi).join('')
}

loadPokemonItens(offset, limit)

loadMoreButton.addEventListener('click', () => {
  offset += limit
  if (offset + limit >= maxRecords) {
    loadPokemonItens(offset, maxRecords - offset)
    loadMoreButton.remove()
  } else {
    loadPokemonItens(offset, limit)
  }
})

searchButton.addEventListener('click', async () => {
  const value = searchInput.value.trim()
  if (!value) return
  const pokemon = await pokeApi.getPokemonByNameOrId(value)
  pokemonList.innerHTML = pokemon ? convertPokemonToLi(pokemon) : `<p>Pokémon não encontrado!</p>`
})
