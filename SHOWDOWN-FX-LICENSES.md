# Imagens de efeitos do Pokémon Showdown — origem e licenças

Este projeto de fãs usa **58 arquivos PNG de efeitos de batalha** publicados no repositório do cliente do [Pokémon Showdown](https://github.com/smogon/pokemon-showdown-client), diretório `play.pokemonshowdown.com/fx/`. Os arquivos foram preservados sem redesenho e codificados em base64 nos nove arquivos `showdown-fx-pack-*.js`, para funcionarem offline/sem depender do CDN. A coreografia de golpes vem do arquivo upstream `battle-animations-moves.ts`, anotado como **CC0-1.0**.

**A maior parte das texturas do diretório FX** está coberta pela declaração de **CC0** em `battle-animations.ts` upstream. O próprio projeto faz ressalvas expressas para arquivos específicos, que devem manter suas licenças:

- `icicle.png`, `lightning.png`, `bone.png`: nota upstream identifica arte de Clint Bellanger e distribuição sob GPLv2/GPLv3/CC-BY-SA-3.0. Detalhes: [Icicle Spell](https://opengameart.org/content/icicle-spell) e [Lightning Shock Spell](https://opengameart.org/content/lightning-shock-spell). Nota: versões modificadas devem obedecer às condições da licença escolhida.
- `rocks.png`, `rock1.png`, `rock2.png`: nota upstream identifica autor *Gilad* (Pokémon Online) e licença **GPLv3**. Consulte a [GPLv3](https://www.gnu.org/licenses/gpl-3.0.html).
- Os demais arquivos podem conter notas adicionais de autores no [código-fonte](https://github.com/smogon/pokemon-showdown-client/blob/master/play.pokemonshowdown.com/src/battle-animations.ts); preservamos os créditos e não atribuímos propriedade das imagens ao autor deste aplicativo.

**Importante:** a disponibilidade pública desses recursos não concede direitos sobre o nome, personagens, modelos ou marcas Pokémon. Pokémon pertence a seus respectivos titulares. O projeto não é afiliado a Nintendo, Game Freak, Creatures ou The Pokémon Company.

Fontes de código: [battle-animations.ts](https://github.com/smogon/pokemon-showdown-client/blob/master/play.pokemonshowdown.com/src/battle-animations.ts) (MIT/CC0, conforme trechos), [battle-animations-moves.ts](https://github.com/smogon/pokemon-showdown-client/blob/master/play.pokemonshowdown.com/src/battle-animations-moves.ts) (CC0-1.0).

A redistribuição de ativos com GPL/CC-BY-SA requer respeitar as obrigações específicas dessas licenças. Não utilize as texturas como se fossem propriedade autoral do app.
