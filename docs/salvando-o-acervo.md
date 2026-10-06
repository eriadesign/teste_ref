# Salvando o acervo

Referências guarda tudo no navegador, e é isso que deixa a interface instantânea
e o app inteiro funcionando offline. O problema é que navegador esquece: basta
limpar os dados do site, trocar de perfil, reinstalar o navegador ou formatar a
máquina e o acervo vai junto.

A resposta é a **pasta do acervo** — uma pasta de verdade no computador, onde
cada alteração é gravada na hora:

```
A pasta que você escolher/
├─ acervo.json              o acervo agora — reescrito a cada alteração
├─ acervo-anterior.json     a cópia que você salva no botão
├─ historico/               uma versão por dia de uso, guardada sozinha
│  ├─ acervo-2026-09-22.json
│  └─ acervo-2026-10-06-1530-antes-de-limpar.json
└─ imagens/                 uma imagem por referência, com o nome que você deu
   ├─ Logo azul.webp
   └─ feeling (2).webp
```

`historico/` e os nomes pelo título são da página publicada; o app completo
ainda grava `imagens/<id>.webp` e só a cópia manual. Os dois leem a pasta um do
outro, porque cada referência no `acervo.json` diz qual é o arquivo dela.

Isso **não é um export**. Você não aperta nada, não escolhe um momento, não
precisa lembrar: salvar uma referência é gravar na pasta. E na abertura
seguinte é de lá que o acervo volta, se o navegador tiver esquecido.

> O formato é o mesmo nas duas versões (a página publicada e o app completo),
> então uma pasta gravada por uma abre na outra.

---

## Na página publicada (ou no `index.html` solto)

Barra lateral → o rodapé que diz onde o acervo está salvo → **Escolher a
pasta**. Daí em diante o rodapé mostra `Salvo em <pasta>/`.

Precisa de um navegador baseado em Chromium (Chrome, Edge, Brave, Arc, Opera):
só eles deixam uma página gravar direto numa pasta. No Firefox e no Safari o
botão explica isso e o acervo segue vivendo só no navegador.

**Ao reabrir**, o Chrome costuma pedir permissão de novo pra pasta — aparece um
aviso com **Reconectar** e um clique resolve. Pra ele parar de perguntar, marque
"Permitir sempre neste site" quando o navegador oferecer.

**Se o navegador for limpo**, a página abre com o acervo de exemplo. Clique em
**Já tenho uma pasta de acervo** (no estado vazio) ou em **Escolher a pasta** e
aponte a mesma pasta: tudo volta — imagens inclusive — e os exemplos que você
nunca tocou saem de cena sozinhos.

**Dica que vale por um serviço:** escolha uma pasta dentro do Google Drive, do
OneDrive ou do Dropbox. O acervo passa a ir pra nuvem e pro outro computador sem
mais nenhum passo, e sem conta nenhuma no app.

---

## No app completo (`npm run dev` / `npm start`)

Aqui quem grava é o servidor, então funciona em qualquer navegador — e a
recuperação é automática: se o navegador esquecer o acervo, ele volta de disco
na próxima abertura, sem clique nenhum.

```bash
npm run dev            # já vem ligado, gravando em ./data
VAULT_DIR=./acervo npm start   # em produção, escolha a pasta
```

| Situação | Pasta do acervo |
| --- | --- |
| `npm run dev`, sem `DATABASE_URL` | ligada em `./data` |
| `VAULT_DIR=<caminho>` | ligada em `<caminho>` (relativo ou absoluto) |
| `VAULT_DIR=off` | desligada |
| Produção sem `VAULT_DIR` | desligada |

A barra lateral passa a mostrar `Salvo em …/data`, e **Ajustes** tem o caminho
completo e um botão de gravar agora.

Produção vem desligada de propósito: em servidor serverless o disco é efêmero
(a pasta some no próximo deploy) e o app costuma ser público — e **a pasta não
tem senha**: quem alcança o app alcança o acervo. Ligue em produção só quando o
disco for persistente e o acesso já for restrito. Pra acervo de verdade em
servidor público, o caminho é a [sincronização com conta](../README.md#sincronizar-entre-dispositivos).

---

## Como o disco e o navegador se conciliam

O IndexedDB continua sendo a fonte de render — a tela nunca espera o disco. Por
cima dele:

- **Toda escrita agenda uma gravação.** Um segundo depois da última alteração a
  pasta é regravada inteira. Uma rajada (colar vinte links de uma vez) vira uma
  gravação só, e fechar a aba força o que estiver pendente.
- **O `acervo.json` é trocado por inteiro, nunca remendado.** A gravação vai
  primeiro num arquivo temporário e só então substitui o antigo: um travamento
  no meio não deixa o arquivo pela metade.
- **A imagem tem o nome que você deu.** O arquivo se chama como o título da
  referência; títulos iguais ganham `(2)`, `(3)`… Renomear a referência
  renomeia o arquivo na gravação seguinte, e quem já tem um nome que combina com
  o título fica com ele — apagar uma imagem não sai renomeando as irmãs. O
  `acervo.json` anota qual arquivo é de qual referência, então um nome ocupado
  por outra imagem (ou por algo que você pôs na pasta à mão) nunca é
  sobrescrito, e arquivo que não é do app nunca é apagado.
- **Nome de máquina vira "Imagem sem nome".** O hash que o Pinterest dá aos
  arquivos, o `image.png` de um print colado: o título vira o nome do arquivo,
  e esses não dizem o que a imagem é. É o convite pra você dar o nome.
- **Imagem se grava uma vez.** O que já está na pasta com o nome certo não sobe
  de novo. O que nenhuma referência cita mais sai da pasta — a não ser que
  alguma versão guardada ainda cite: aí fica, e o `acervo.json` a lista em
  `imagensGuardadas`.
- **As versões não dependem de você.** Na primeira gravação de cada dia, a
  versão com que o acervo fechou o último dia de uso vai pra `historico/` antes
  de ser sobrescrita. Ficam as 30 últimas. "Limpar acervo" também deixa uma lá
  antes de apagar — se não conseguir gravá-la, não apaga nada.
- **A cópia manual é sua.** Nenhuma gravação automática escreve em
  `acervo-anterior.json`: só o botão de salvar cópia.
- **Na abertura, vence o mais recente.** Se a pasta tem uma versão mais nova de
  uma referência, ela entra; se este navegador tem, ele fica. Trazer de volta
  nunca desfaz uma edição recente.
- **Se a pasta ainda estiver como a deixamos, nada é lido.** A comparação é o
  carimbo de horário da última gravação — por isso abrir o app cem vezes não
  custa cem leituras do acervo inteiro.

### O que ele não é

Não é sincronização. Dois computadores gravando na mesma pasta (via Drive, por
exemplo) funcionam bem no uso normal, porque cada abertura traz o que o outro
escreveu, mas **uma exclusão feita com a pasta desconectada volta atrás**: sem
lápide no arquivo, o que existe na pasta e não existe aqui é lido como coisa a
recuperar, não como coisa apagada. Pra várias máquinas ao mesmo tempo, com
exclusão propagando de verdade, use a sincronização com conta.

E não substitui um backup fora da máquina: a pasta protege contra perder o
navegador, não contra perder o computador. **Ajustes → Exportar tudo** continua
sendo a cópia portátil, num arquivo só.

---

## Versões guardadas

Três arquivos, três papéis:

| Arquivo | Quem escreve | Quando muda |
| --- | --- | --- |
| `acervo.json` | o app | a cada alteração, um segundo depois |
| `historico/acervo-<dia>.json` | o app, sozinho | uma vez por dia de uso: guarda como o acervo fechou o dia anterior |
| `historico/…-antes-de-limpar.json` | o app, sozinho | antes de "Limpar acervo" apagar qualquer coisa |
| `acervo-anterior.json` | **você** | só quando aperta salvar a cópia |

`acervo.json` é o espelho: se você apagar tudo, ele fica vazio em um segundo —
é a definição de tempo real. O histórico é o que você não precisa lembrar de
fazer: as 30 últimas versões ficam lá, e as imagens que qualquer uma delas cita
continuam na pasta. `acervo-anterior.json` é o ponto que você escolheu,
congelado até escolher outro — vale salvar antes de uma faxina grande.

**Ver e restaurar:** rodapé da barra lateral → *Onde o acervo é salvo* →
**Versões guardadas**. Cada versão mostra a data e quantas referências tem, com
um botão de restaurar. A restauração **soma** ao acervo de agora, não
substitui: em cada referência fica a versão editada por último, o que você
criou depois continua aí, e as imagens voltam junto — mesmo que o arquivo tenha
mudado de nome desde então.

No app completo existe só a cópia manual, em Ajustes → *Salvo em disco*.

---

## Trazendo de volta pelo import

O caminho mais completo é **Ajustes → Importar pasta**: escolha a pasta do
acervo e o `acervo.json` e as imagens entram juntos. Se a pasta tiver mais de
uma versão — a cópia manual, o histórico — a página pergunta qual importar.
Funciona em qualquer navegador e não conecta a pasta: ela só é lida. (O
navegador pode perguntar se você quer "enviar" os arquivos: nada sai do
computador.)

| O que você tem | O que entra |
| --- | --- |
| A pasta inteira, pelo *Importar pasta* | Tudo, imagens inclusive, e você escolhe a versão |
| A pasta inteira, conectada em *Escolher a pasta* | Tudo, e o salvamento religa |
| `acervo.json` sozinho, pelo *Importar arquivo* | Tudo, com as imagens pendentes |
| Só a pasta `imagens/` (ou os arquivos arrastados) | As imagens pendentes voltam pra referência delas |
| O backup exportado (`.json`) | Tudo, com as imagens embutidas no arquivo |

**Imagem pendente** é a referência que entrou sem o arquivo: o card mostra
"imagem não encontrada", o painel diz como o arquivo se chamava e oferece
escolher o arquivo ou a pasta. Arrastar as imagens de `imagens/` pra página
também resolve: a imagem que já é de uma referência completa aquela referência
em vez de virar outra — e a que já está no acervo não entra de novo.
