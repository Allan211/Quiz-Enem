# Quiz ENEM — Ciências da Natureza 2024 (projeto do quiz)

Questionário interativo e explicativo, 100% local (HTML + CSS + JavaScript puro, sem internet, sem instalação).

- **Fonte das questões:** simulado "Ciências da Natureza e suas Tecnologias (ENEM 2024)" do Toda Matéria — 44 questões, enunciados e alternativas copiados do texto enviado, sem reescrita.
- **Gabarito:** conferido com o gabarito oficial do ENEM 2024 (2º dia, caderno azul, questões 91 a 135). A questão 129 foi anulada pelo MEC e por isso o simulado tem 44 questões e não 45.
- **Projeto irmão:** `enem-guia-cn-2024` (guia de como resolver cada questão). São projetos separados, ligados pela numeração: Questão N do quiz = Questão N do guia.

## Passo a passo para usar

1. Descompacte o `.zip` em qualquer pasta (mantenha a estrutura de pastas).
2. Dê dois cliques em `index.html` (abre no navegador; funciona offline).
3. Escolha o **bloco** (cada bloco tem até 45 questões) e o **modo**:
   - **Estudo:** marque a alternativa, clique em **Verificar** e veja o gabarito, a explicação, o "como chegar na resposta" e a armadilha comum.
   - **Simulado:** cronômetro de 2h30; gabarito e explicações só ao finalizar.
4. Use a grade numerada para pular entre questões. Teclado: `A`–`E` marcam, `←` e `→` navegam.
5. Ao finalizar você vê acertos, % por disciplina e pode revisar todas (ou só as erradas) com a explicação.
6. O último resultado de cada bloco fica salvo no navegador (localStorage).

## Estrutura de pastas

```
enem-quiz-cn-2024/
├─ index.html        página do quiz
├─ css/estilo.css    visual
├─ js/questoes.js    BANCO DE QUESTÕES (é o único arquivo que muda ao trocar o banco)
├─ js/app.js         lógica do quiz
├─ img/              figuras opcionais (veja abaixo)
└─ README.md
```

## Figuras (importante)

O texto copiado do site não traz as imagens (gráficos, esquemas, tirinhas, alternativas em figura). O quiz mostra uma caixa tracejada no lugar. Para completar, salve as imagens na pasta `img/` com estes nomes (png, jpg, jpeg, webp ou svg):

- `q01.png`, `q02.png`, … `q44.png` → figura do enunciado da questão (dois dígitos).
- `q02-alternativas.png`, `q22-alternativas.png`, `q31-alternativas.png`, `q37-alternativas.png`, `q40-alternativas.png` → as cinco questões cujas **alternativas são figuras**. Nelas o quiz mostra botões "Alternativa A (figura)", "B", etc.

Sem as imagens o quiz funciona, mas essas questões ficam difíceis de resolver; as explicações indicam o raciocínio e a letra correta.

## Como trocar o banco de questões

1. Substitua `js/questoes.js` pelo novo banco (mesmo formato) e, se houver figuras, o conteúdo de `img/`.
2. Formato resumido de cada questão:

```js
{ n: 1, refOficial: 91, disc: "Física", tema: "...",
  paras: ["parágrafo 1", "parágrafo 2", "comando da questão"],
  alts: { a: "...", b: "...", c: "...", d: "...", e: "..." },
  altsEmFigura: false,
  gab: "B", explicacao: "...", passos: ["...", "..."], armadilha: "..." }
```

3. `meta.tamanhoBloco` controla o tamanho dos blocos (45). `meta.versao` separa o histórico salvo de bancos diferentes.
4. Combinado: quando quiser mudar as questões, digite **2** e envie o banco novo no chat; a conversão para este formato e a atualização do guia ficam por conta do Claude.

## Observações de fidelidade

- Os textos vêm do arquivo enviado. Só houve ajuste tipográfico na Questão 29 (símbolos de vetor, escritos como `vc→` e `vn→`) e na Questão 28 (o quadro foi exibido como tabela, com os mesmos dados).
- Erros de origem foram mantidos (ex.: início da Questão 23 aparece como "uema" e potências como "10 5" aparecem sem expoente, como no texto copiado).
