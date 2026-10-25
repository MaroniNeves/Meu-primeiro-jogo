# Meu Primeiro Jogo — Ateliê Arcano

Laboratório/jogo 3D independente com floresta, grama Quaternius,
personagem animado, ciclo de clima, física da água e ecossistema.

## Abrir o laboratório ou jogar no navegador

- **[🧪 Abrir o Laboratório Arcano (V12.67)](https://raw.githack.com/MaroniNeves/Meu-Primeiro-jogo/main/agua.html)** — simulação completa com os controles de chuva, água, vento, floresta, solo e ecossistema.
- **[🎮 Abrir o Meu Primeiro Jogo](https://raw.githack.com/MaroniNeves/Meu-Primeiro-jogo/main/index.html)** — mesma cena, com o botão **Jogar** para controlar o personagem.

### Bibliotecas de magias restauradas

O antigo catálogo de magias voltou a fazer parte deste repositório, agora na pasta `magias/`, com modelos, texturas e bibliotecas próprias:

- **[✨ 100 Magias 3D Anime](https://raw.githack.com/MaroniNeves/Meu-Primeiro-jogo/main/magias/index.html)** — coleção completa de magias e efeitos por escola.
- **[⚔️ Cortes de Espada e Magias 3D](https://raw.githack.com/MaroniNeves/Meu-Primeiro-jogo/main/magias/espadas.html)** — demonstração de espada e outras magias.
- **[🌀 Rollshade](https://raw.githack.com/MaroniNeves/Meu-Primeiro-jogo/main/magias/rollshade.html)** — efeitos Rollshade.
- **[⚡ Raios](https://raw.githack.com/MaroniNeves/Meu-Primeiro-jogo/main/magias/lightning.html)** — efeitos elétricos.
- **[📦 Catálogo de pacotes](https://raw.githack.com/MaroniNeves/Meu-Primeiro-jogo/main/magias/catalogo.html)** — referências de bibliotecas.

Na barra superior do laboratório, use **✨ 100 Magias** ou **⚔️ Efeitos 3D** para abrir as páginas recuperadas; dentro das magias há um link de volta ao laboratório.

No laboratório, toque em **☷ Mostrar ajustes** se o painel estiver recolhido. Se estiver no modo Jogar, use **← Sair do jogo** para retornar aos controles do laboratório.

**Este repositório já está público.** Os dois links executam arquivos de sua própria raiz (não dependem do antigo repositório `projeto`). O serviço GitHack precisa estar acessível no navegador e os recursos externos de Three.js precisam carregar normalmente.

Arquivos de entrada: `agua.html` e `index.html`, ambos com a versão V12.63.

## Personagem original e magias VERDADEIRAS do laboratório (V12.66)

O modo **🎮 Jogar** voltou a utilizar o **Xbot original**, com animações
Idle, Walk e Run do GLB de Three.js. O feiticeiro FBX da galeria não
substitui mais o personagem jogável.

Os três botões de conjuração importam as **classes autênticas de efeitos da
biblioteca de 100 Magias**, sem inventar novos projéteis, texturas ou formatos:

- **1 — Arcane Volley**: `magias/assets/ArcaneVolleyAbility-F0sG67Uf.js`
- **2 — Dragonbreath**: `magias/assets/DragonbreathAbility-x2rdc5jW.js`
- **3 — Glacier**: `magias/assets/GlacierAbility-CelHSKik.js`

O adaptador `magias/originais-no-jogo.js` preserva os shaders, geometrias,
lógicas e partículas da galeria. Há ajustes estritamente necessários de
compatibilidade entre a versão de Three.js da galeria e a do jogo e
limites de partículas para dispositivos móveis. Bibliotecas já estão
armazenadas neste mesmo repositório.

**Importante:** esses efeitos originais usam um motor complexo e podem
consumir mais GPU, principalmente em celulares. O Dragonbreath (magia 2)
agora pode iniciar fogo na grama à frente do jogador, sem reescrever o
efeito original da magia nem alterar a hidrologia do jogo.

**Licenças:** os arquivos FBX e texturas vieram da biblioteca histórica e
podem conter licenças independentes; confira os termos de origem antes de
distribuir comercialmente.

## Fogo e queimadas ecológicas na grama 3D (V12.68)

A simulação utiliza o atlas de fogo **Animated Fire**, por **BenHickling**,
obtido de **OpenGameArt**, com licença **CC0**. O arquivo original está em
`fire-assets/fire1_64.png` e a origem/licença constam de
`fire-assets/ORIGEM.txt`:
https://opengameart.org/content/animated-fire

### Visual 3D opcional do Poly Pizza

O laboratório agora aceita um **GLB de fogo** sem substituir a física da
queimada. Opção recomendada: [Flame Decal — Quaternius, Poly Pizza](https://poly.pizza/m/8DEKYKfH2h),
marcado como **Public Domain (CC0)** na página oficial.

1. Na página do Poly Pizza, baixe o arquivo **GLTF/GLB**.
2. Abra **Laboratório → Ecossistema**, procure **Modelo de chama personalizado (.glb)**
   e selecione o arquivo baixado.
3. Clique em **🔥 Acender grama (teste)**. Até 12 focos de fogo no celular
   (24 no computador) usam o GLB importado; os demais mantêm a chama animada
   existente para proteger o FPS.
4. Clique em **↩ Fogo padrão** para voltar às chamas animadas.

O modelo é lido **localmente pelo navegador**, não enviado à internet nem
salvo automaticamente no repositório. Ainda **não há um arquivo GLB do Poly Pizza
incluído nos arquivos publicados**, porque o download direto do catálogo requer
uma URL autorizada e o material precisa ser baixado pela página oficial.
A alternativa OpenGameArt continua funcionando mesmo sem o GLB.

**Não use o modelo estático para simular crescimento ou propagação.** Ele troca
somente a aparência das chamas: chuva, umidade, vento, carvão, cinzas e
recuperação da grama continuam sob controle de `fogo-grama-v1267.js`.

Outras opções CC0 pesquisadas: [Kenney Particle Pack](https://kenney.nl/assets/particle-pack)
(80 sprites gratuitos para efeitos). Não foi necessário incluir o pacote
completo no jogo — o sprite selecionado é pequeno e roda localmente.

Como testar:
- No **Laboratório**, abra o painel do ecossistema, defina **chuva 0** e
  clique em **🔥 Acender grama (teste)**; observe as chamas e a escurecimento
  das próprias hastes 3D. O botão **💧 Apagar fogo** interrompe as chamas,
  mas deixa o terreno carbonizado.
- No modo **Jogar**, use a magia **2 — Dragonbreath** em direção à vegetação;
  ela dispara exatamente a magia original e tenta incendiar o solo.
- O vento ajuda a propagação para sotavento, a chuva e o solo encharcado
  impedem novas ignições ou apagam o incêndio, e o gramado recupera o verde
  gradualmente após a extinção (leva alguns minutos de simulação).

A queimada é uma **simulação simplificada, não um modelo científico de
incêndio florestal**. Utiliza textura de calor/carvão amostrada no shader
das gramíneas Quaternius — não remove as milhões de instâncias.
As chamas, a fumaça e o solo escuro são renderizados com poucas
`InstancedMesh`, com limite de objetos visíveis para manter o desempenho
móvel. Os testes `tools/testar-incendio-grama.js` e
`tools/testar-fogo-webgl.cjs` verificam física, extinção, recuperação,
licença local e chamas visíveis no WebGL.

## Executar localmente (mesmo se privado)

Baixe/clone o repositório e, na pasta raiz, execute:

```bash
python3 -m http.server 8000
```

Abra `http://localhost:8000/` no navegador.
Abrir o HTML diretamente com `file://` não é equivalente: o navegador
pode bloquear a leitura de arquivos locais usados por modelos 3D.

## Integridade

A rotina `.github/workflows/verificar-jogo.yml` verifica, em toda alteração,
que a página inicial e os arquivos locais essenciais continuam disponíveis.
Foi migrado o conteúdo integral da pasta `atelie-arcano-laboratorio/` do
antigo repositório. A versão original permanece preservada por segurança.

Parte das bibliotecas Three.js, o Xbot e alguns recursos opcionais ainda
podem ser baixados de fontes públicas, como no laboratório original.
