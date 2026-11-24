# NeoCore Computer Lab

**Simulador didático de Arquitetura e Organização de Computadores**  
**Disciplina:** Computer Architecture and Organization — UNIFECAF  
**Projeto:** Prova de conceito para a empresa fictícia NeoCore Tech

## 📌 Sobre o projeto

O **NeoCore Computer Lab** é uma aplicação web que demonstra, de forma interativa, como os componentes de um computador cooperam na execução de instruções. O simulador adota uma **arquitetura didática baseada em Von Neumann**, na qual instruções e dados compartilham a mesma memória lógica, e apresenta um ciclo simplificado de **busca (fetch), decodificação (decode) e execução (execute)**.

A interface permite acompanhar os principais componentes da CPU, os valores nos registradores, a hierarquia de memória, os barramentos e os dispositivos de entrada e saída. Foi criada como material de apoio ao aprendizado, não como reprodução física de um processador real.

## 🎯 Objetivos

- Visualizar o funcionamento da CPU: Unidade de Controle, Unidade Lógica e Aritmética (ULA) e registradores.
- Demonstrar o ciclo **fetch → decode → execute**, uma fase por vez.
- Acompanhar a movimentação de instruções e dados na memória e nos barramentos.
- Exemplificar leituras e escritas na RAM, incluindo **acertos (hits)** e **falhas (misses)** da cache de dados.
- Executar programas simples e observar os resultados no monitor virtual.

## 🛠️ Tecnologias utilizadas

- **HTML5:** estrutura da interface;
- **CSS3:** layout e apresentação visual;
- **JavaScript:** lógica da CPU, memória, cache, execução dos programas e interação.

**Não é necessário** instalar bibliotecas, banco de dados ou servidor. O simulador funciona **offline** em um navegador moderno.

## 📂 Estrutura dos arquivos

```text
NeoCore_VSCode/
├── index.html                           # Interface principal
├── style.css                            # Estilos e responsividade
├── script.js                            # Lógica e programas da simulação
├── NeoCore_Simulador_Arquivo_Unico.html # Versão independente: tudo em um HTML
├── README.md                            # Documentação do projeto
└── LEIA-ME.md                           # Instruções rápidas
```

> **Importante:** mantenha `index.html`, `style.css` e `script.js` na mesma pasta. A versão de arquivo único não depende dos outros dois arquivos.

## 🚀 Como executar no VS Code

1. Extraia a pasta do projeto para seu computador.
2. Abra o **Visual Studio Code**.
3. Vá até **Arquivo → Abrir Pasta** e selecione a pasta `NeoCore_VSCode`.
4. Abra `index.html` no navegador (por exemplo, com a opção de abrir o arquivo pelo explorador do sistema).
5. Opcionalmente, instale a extensão **Live Server**, clique com o botão direito em `index.html` e escolha **Open with Live Server**.

Também é possível abrir diretamente `NeoCore_Simulador_Arquivo_Unico.html` no navegador, sem configurar nada.

## 🧭 Como utilizar o simulador

1. Em **Programa de demonstração**, escolha um dos três exemplos disponíveis.
2. Ajuste os campos **RAM [32]**, **RAM [33]** ou **Entrada**, caso deseje testar novos valores.
3. Clique em **Reiniciar** para carregar os valores e reiniciar o estado da máquina.
4. Clique em **Próxima etapa** para avançar uma fase do ciclo de instrução: `FETCH`, `DECODE` ou `EXECUTE`.
5. Se preferir, use **Executar automático** para acompanhar a execução contínua; o mesmo botão permite pausar.
6. Observe os registradores, o PC, o IR, o MAR, o MDR, a ULA, os barramentos, a cache e o monitor virtual.
7. Clique em **Exportar execução** para gerar um arquivo `.txt` com o histórico e os resultados, útil como evidência do trabalho.

Os campos de entrada aceitam números inteiros de **0 a 255**, coerentes com a representação didática de dados de 8 bits.

## 💻 Programas disponíveis

### 1. Soma, memória e saída

```asm
LOAD R2, [32]
LOAD R3, [33]
ADD R1, R2, R3
STORE [34], R1
OUT R1
HALT
```

Com os valores padrão `RAM[32] = 7` e `RAM[33] = 5`, a ULA calcula **7 + 5 = 12**. O resultado aparece no registrador `R1`, é armazenado em `RAM[34]` e exibido no monitor virtual.

### 2. Demonstração da cache

```asm
LOAD R2, [32]
LOAD R3, [32]
ADD R1, R2, R3
STORE [34], R1
LOAD R0, [34]
OUT R0
HALT
```

O primeiro acesso de leitura ao endereço `[32]` produz uma **falha (miss)**, pois a cache começa vazia. A segunda leitura do mesmo endereço produz um **acerto (hit)**. O programa também demonstra a atualização da cache e da RAM após `STORE` e a leitura posterior do resultado.

### 3. Entrada e saída

```asm
IN R2
LOAD R3, [33]
ADD R1, R2, R3
OUT R1
HALT
```

Com os valores padrão `Entrada = 9` e `RAM[33] = 5`, o monitor exibe **14**. Esse programa ilustra a comunicação da entrada com os registradores, a ULA e a saída.

## 🧠 Componentes simulados

| Componente | Função no simulador |
| --- | --- |
| **Unidade de Controle (UC)** | Coordena as fases do ciclo e interpreta o código da instrução. |
| **ULA** | Executa operações aritméticas, como `ADD` e `SUB`. |
| **PC (Program Counter)** | Indica o endereço da próxima instrução. |
| **IR (Instruction Register)** | Mantém a instrução em processamento. |
| **MAR / MDR** | Representam o endereço acessado e o dado/instrução transferido. |
| **R0 a R3** | Registradores de propósito geral para operandos e resultados. |
| **Flag Z** | Indica quando determinados resultados são iguais a zero. |
| **RAM** | Memória lógica compartilhada por instruções e dados, com 64 posições. |
| **Cache de dados** | Cache de mapeamento direto, com 4 linhas, para demonstrar hits e misses. |
| **Barramentos** | Exibem endereço, dado e sinal de controle (`READ`, `WRITE`, `IN`, `OUT`, etc.). |
| **Entrada/Saída** | Recebe um valor numérico e apresenta o resultado em um monitor virtual. |

### Ciclo de instrução

1. **FETCH (busca):** o PC indica a posição da instrução na RAM; a UC simula sua leitura e a carrega no IR, atualizando o PC.
2. **DECODE (decodificação):** a UC identifica o opcode e os operandos da instrução.
3. **EXECUTE (execução):** a instrução efetua a operação correspondente: leitura, escrita, cálculo ou entrada/saída. A instrução `HALT` encerra o programa.

> Cada clique em **Próxima etapa** corresponde a uma *fase pedagógica* do modelo. A contagem de microetapas da interface não equivale a ciclos de clock reais.

## ✅ Como conferir o funcionamento

Teste os exemplos com os valores padrão e compare com os resultados abaixo:

| Teste | Procedimento | Resultado esperado |
| --- | --- | --- |
| Soma | Escolher **Soma, memória e saída** e executar até `HALT` | `R1 = 12`, `RAM[34] = 12`, monitor `12` |
| Cache | Escolher **Cache: hit e miss** e executar | Primeira leitura de `[32]`: miss; segunda: hit |
| Entrada/saída | Escolher **Entrada e saída** e executar | Monitor `14` |
| Rastreamento | Clicar em **Exportar execução** | Download de um `.txt` com fases e dados do programa |

## 📖 Limitações e decisões didáticas

Este trabalho busca **clareza conceitual**, e por isso usa algumas simplificações:

- Os programas são **predefinidos no arquivo `script.js`**; a interface não é um editor livre de código de máquina.
- A CPU é um **modelo lógico de 8 bits**, com registradores gerais de `R0` a `R3`, e dados inteiros sem sinal. Operações aritméticas armazenam os 8 bits menos significativos do resultado.
- A memória contém **64 posições lógicas**; instruções são objetos representados em JavaScript, não instruções binárias reais.
- A **cache de dados** é simulada separadamente da busca de instruções; possui 4 linhas e utiliza mapeamento direto, política de escrita *write-through* e alocação na escrita.
- Não há circuitos digitais físicos, pipeline, interrupções, temporização por clock ou representação fiel de toda a hierarquia de armazenamento.
- Os barramentos são **representações visuais e funcionais simplificadas** dos fluxos, não fios elétricos ou transmissões bit a bit.

Essas decisões fazem do NeoCore uma **prova de conceito funcional e didática**, adequada para demonstrar a interação dos componentes sem confundir a modelagem com um computador completo.

## 🎓 Utilização no trabalho acadêmico

O projeto foi preparado para a disciplina **Computer Architecture and Organization**, da **UNIFECAF**, no contexto do desafio **“NeoCore Computer Lab — Simulação e Análise da Arquitetura Interna de um Computador”**.

Na apresentação, recomenda-se demonstrar a execução do programa de soma **passo a passo**, identificando o papel da Unidade de Controle, do PC, do IR, da ULA, dos registradores, da RAM e dos barramentos. Em seguida, mostre rapidamente a cache e a entrada/saída.

**Entregáveis previstos pelo enunciado:**

1. Relatório técnico em PDF, vinculado à implementação desenvolvida.
2. Arquivo do simulador ou projeto funcional.
3. Vídeo de apresentação de **até 4 minutos**, com link acessível para avaliação.

**Antes de enviar:** preencha seus dados acadêmicos, teste os arquivos em seu computador e confirme com o professor se a modelagem funcional em HTML/JavaScript é aceita no ambiente de entrega.

## 📄 Autoria

**Projeto acadêmico:** NeoCore Computer Lab  
**Instituição:** UNIFECAF  
**Curso:** Análise e Desenvolvimento de Sistemas  
**Disciplina:** Computer Architecture and Organization  
**Aluno(a):** _[Preencher nome]_  
**Ano:** 2026

---

*NeoCore Computer Lab — aprendendo arquitetura de computadores por meio da simulação.*
