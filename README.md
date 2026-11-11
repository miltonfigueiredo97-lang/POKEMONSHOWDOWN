# Pokémon Arena — v0.4

Jogo de fãs em HTML, CSS e JavaScript: batalha 6v6 PvE, PvP local e conexão online experimental entre amigos. **Não é o motor completo do Pokémon Showdown.**

## Jogar

- **Arena:** [Abrir jogo](https://pokemonshowdown-mackmus.vercel.app/)
- **Montar equipe:** [Abrir Team Builder](https://pokemonshowdown-mackmus.vercel.app/team.html)
- Após configurar os seis Pokémon no editor, clique em **Salvar equipe**, volte à arena e inicie uma nova batalha.

## Novidades da versão 0.4

- Editor **separado** para seis Pokémon, incluindo formas disponíveis na PokéAPI; escolha **quatro golpes**, **habilidade**, **item**, **natureza**, **nível**, **IVs** e **EVs**.
- Golpes apresentam **tipo, poder, precisão e PP** extraídos da PokéAPI. É possível importar/exportar times em texto compatível com o formato básico do Showdown.
- A arena exibe **HP**, status, **ATK, DEF, SPA, SPD, SPE**, estágios de boost, item e habilidade.
- As estatísticas dos Pokémon controlados pelo jogador usam cálculos de **nível, EV, IV e natureza**. Fórmula de dano ampliada para interações comuns.
- Sprites animados **Pokémon Champions**, quando disponíveis; fallback para **Legends Z-A, Scarlet/Violet, Showdown, Gen 5, HOME**.
- **Campos e texturas de efeitos do CDN Pokémon Showdown** com seleção de arena. Ataques utilizam sprites reais do diretório FX, compartilhados entre vários golpes, além dos efeitos próprios e animação estilizada de Pokébola na troca.

## Limitações importantes

- **Pokémon Champions não tem sprites para todas as espécies/formas.** O editor não está limitado à coleção Champions; usa a PokéAPI para acessar espécies e formas adicionais.
- O jogo permite escolher golpes da base de dados da espécie, mas **nem todos os golpes têm efeitos completos implementados**. Em alguns casos, as texturas de ataque são genéricas por tipo; ainda não há uma coreografia oficial exclusiva para cada golpe.
- **Habilidades e itens** podem ser escolhidos e são exibidos, mas seus efeitos de combate ainda não estão implementados integralmente.
- **Não reproduz integralmente as regras competitivas do Showdown.** O motor autêntico do Showdown precisará ser integrado antes de considerar calculados todos os efeitos, legalidade, clima, habilidades, itens e turnos.
- A transição de Pokébola tem aparência 3D via CSS, **não é um modelo 3D oficial**. Os cenários são do **Showdown**, não cenários 3D extraídos de Pokémon Champions.
- O PvP remoto ainda é experimental. É preciso conexão com internet para consultar a PokéAPI e carregar as imagens externas.

## Estrutura

- `index.html`, `app.js`, `styles.css` — arena
- `team.html`, `teambuilder.js`, `teambuilder.css` — editor
- `supabase/schema.sql` — esquema opcional **ainda não implantado**, com RLS
- As configurações da equipe ficam salvas no navegador (localStorage).

## Direitos de terceiros

Projeto independente de fãs, não afiliado à Nintendo, Game Freak, Creatures ou The Pokémon Company. Código autoral e imagens do jogo têm direitos distintos: o fato de o repositório estar público ou um projeto fornecer sprites em seu GitHub **não torna os personagens e as imagens livres de direitos autorais**.

Fontes: [PokéAPI](https://pokeapi.co/docs/v2), [PokeAPI/sprites](https://github.com/PokeAPI/sprites), [Pokémon Showdown](https://github.com/smogon/pokemon-showdown), [FX do Showdown](https://play.pokemonshowdown.com/fx/).
