# Meu Primeiro Jogo — Ateliê Arcano

Laboratório/jogo 3D independente com floresta, grama Quaternius,
personagem animado, ciclo de clima, física da água e ecossistema.

## Abrir o laboratório ou jogar no navegador

- **[🧪 Abrir o Laboratório Arcano (V12.63)](https://raw.githack.com/MaroniNeves/Meu-Primeiro-jogo/main/agua.html)** — simulação completa com os controles de chuva, água, vento, floresta, solo e ecossistema.
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

## Personagem lançador de magias (V12.65)

No modo **🎮 Jogar**, o projeto usa por padrão o mesmo feiticeiro FBX da biblioteca
**100 Magias 3D Anime**, carregado de `magias/models/Idle.fbx` com a textura
`diffuse.png` e os movimentos `cast1.fbx`, `cast2.fbx` e `cast3.fbx`.

As antigas esferas simples foram substituídas por efeitos 3D procedurais no
arquivo `magias/vfx-jogo-v1265.js`, adaptados para o motor do jogo e
inspirados nas linguagens visuais Arcane Volley, Dragonbreath e Glacier
do catálogo, sem copiar o motor independente de VFX:

- **1 / ✦ Rajada Arcana:** três lâminas energéticas entrelaçadas, glifos de conjuração, partículas, rastros e impacto em anéis.
- **2 / ✹ Sopro de Brasas:** cinco pontas de chamas e brasas dispersas, rastro incandescente e explosão breve no destino.
- **3 / ❄ Lâminas Glaciais:** sete cristais em leque, partículas de gelo, rastros frios e impacto de fragmentos.

No computador, pressione **1, 2 ou 3**; no celular, utilize os três botões
do modo Jogar. Cada conjuração reproduz a animação original correspondente.
Efeitos visuais sem dano, inimigos ou modificações na física ecológica.
As magias usam geometria compartilhada, instâncias e duração limitada
para conter os draw calls. Os controles da câmera, do zoom, da ponte, da
grama e da água foram preservados. Se o arquivo FBX falhar, o
manequim Xbot anterior continua sendo usado como reserva.

Os testes `tools/testar-feiticeiro-browser.cjs` e
`tools/testar-magia-webgl.cjs` verificam modelo, animações, formas,
trajetórias, impactos e renderização real no Chrome.

**Licenças:** os arquivos FBX e texturas vieram da biblioteca histórica e
podem conter licenças independentes; confira os termos de origem antes de
distribuir comercialmente.

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
