# Pokémon Arena — protótipo particular (v0.2)

Jogo de fãs em HTML5/JavaScript para batalhas Pokémon 6v6 contra IA (PvE) ou localmente entre dois jogadores. O código é um projeto independente; **não é o simulador completo Pokémon Showdown**.

## Executar

- Abra `index.html` em um navegador moderno, ou inicie um servidor HTTP estático na pasta.
- Para desenvolvimento: `python -m http.server 8000`, depois acesse `http://localhost:8000`.
- `index.html` contém a interface, `styles.css` o visual e `app.js` o motor atual.
- É necessária internet para consultar a PokéAPI e carregar sprites externas do Showdown/PokéAPI.

## O que funciona na versão 0.2

- Batalhas 6v6 contra IA básica, e PvP local no mesmo dispositivo.
- Editor de equipes, 46 espécies de exemplo e pesquisa de outras via PokéAPI.
- Sprites remotas animadas, Gen 5, HD e shiny, com alternativas de imagem quando disponíveis.
- Efeitos visuais próprios por tipo de golpe. **Não estão incluídas animações oficiais individuais de todos os ataques**.
- PvP remoto experimental com PeerJS; salas **não são protegidas por autenticação de verdade**.
- Salvar equipe no navegador; opção de sincronização no Supabase **somente se configurada**.

## Backend (opcional)

Arquivo `supabase/schema.sql`: duas tabelas para equipes e histórico, com Row Level Security restringindo cada usuário aos seus registros. **O SQL não está aplicado em um banco remoto.** Use um projeto Supabase separado para este jogo. A interface permite configurar URL e chave publishable sem alterar o código.

Não use `service_role` ou chaves privadas no navegador, nem as envie ao GitHub. O PvP privado com servidor autoritativo e o motor `@pkmn/sim` **ainda não foram integrados**.

## Visibilidade e direitos

Este repositório está **público**; isso publica o código, **não** significa que o site esteja hospedado ou que as batalhas estejam protegidas. Para um projeto totalmente reservado, altere a visibilidade no GitHub e proteja qualquer hospedagem.

Código original disponível sob a licença MIT (`LICENSE-CODE.txt`). Pokémon, nomes, marcas e sprites são de seus respectivos titulares; os gráficos são requisitados externamente, não redistribuídos no repositório. Sem afiliação à Nintendo, Game Freak, Creatures ou The Pokémon Company.

Referências: [Showdown](https://github.com/smogon/pokemon-showdown), [cliente Showdown](https://github.com/smogon/pokemon-showdown-client), [PokéAPI](https://pokeapi.co/docs/v2), [pkmn](https://github.com/pkmn/ps).
