# Sistema de Gestão de Obras

Aplicação web para gestão de obras de construção civil, desenvolvida com React + Vite e Supabase.

## Funcionalidades

- **Obras** — cadastro de obras com nome e cliente
- **Equipe** — cadastro de funcionários com valor de diária e vínculo a obras
- **Gastos** — registro de despesas por obra (categorias, fotos)
- **Chamada semanal** — controle de presença por dia da semana
- **Lançamento automático** — gera gastos de mão de obra com base na chamada da semana anterior

## Tecnologias

- React 19 + Vite
- Supabase (banco de dados e storage)
- Lucide React (ícones)
- date-fns

## Como rodar

```bash
npm install
cp .env.example .env
# Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env
npm run dev
```

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave pública (anon) do Supabase |

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm run lint` | Verificação ESLint |
