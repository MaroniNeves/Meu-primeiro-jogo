# Meu Primeiro Jogo — Ateliê Arcano

Laboratório/jogo 3D independente com floresta, grama Quaternius,
personagem animado, ciclo de clima, física da água e ecossistema.

## Jogar no navegador

**[▶ Abrir Meu Primeiro Jogo](https://raw.githack.com/MaroniNeves/Meu-Primeiro-jogo/main/index.html)**

**Importante:** o link acima funciona quando este repositório está **público**.
O serviço GitHack não consegue ler arquivos de repositórios privados.
Para liberar o acesso: **Settings → General → Danger Zone →
Change repository visibility → Public**.
Essa operação torna públicos o código, modelos e texturas deste repositório.

O arquivo inicial para hospedagem é `index.html`. O laboratório também
pode ser acessado por `agua.html`; ambos referenciam os modelos e scripts
copiados para esta mesma raiz, sem depender da pasta do repositório antigo.

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
