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
