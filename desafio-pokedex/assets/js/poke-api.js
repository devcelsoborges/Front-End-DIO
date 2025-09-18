const pokeApi = {}

function convertPokeApiDetailToPokemon(pokeDetail) {
  const pokemon = new Pokemon()
  pokemon.number = pokeDetail.id
  pokemon.name = pokeDetail.name
  const types = pokeDetail.types.map(slot => slot.type.name)
  pokemon.types = types
  pokemon.type = types[0]
  pokemon.photo = pokeDetail.sprites.other.dream_world.front_default || pokeDetail.sprites.front_default
  return pokemon
}

pokeApi.getPokemonDetail = async (pokemon) => {
  const response = await fetch(pokemon.url)
  const data = await response.json()
  return convertPokeApiDetailToPokemon(data)
}

pokeApi.getPokemons = async (offset = 0, limit = 10) => {
  const url = `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`
  const response = await fetch(url)
  const data = await response.json()
  const details = await Promise.all(data.results.map(pokeApi.getPokemonDetail))
  return details
}

pokeApi.getPokemonByNameOrId = async (value) => {
  try {
    const url = `https://pokeapi.co/api/v2/pokemon/${value.toLowerCase()}`
    const response = await fetch(url)
    if (!response.ok) throw new Error("Não encontrado")
    const data = await response.json()
    return convertPokeApiDetailToPokemon(data)
  } catch {
    return null
  }
}
