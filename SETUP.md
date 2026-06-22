# SGR Indaiatuba — Guia de Configuração

## 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Anote a **Project URL** e a **anon public key** (em *Settings → API*)

## 2. Configurar o banco de dados

1. No painel do Supabase, vá em **SQL Editor**
2. Cole o conteúdo de `supabase-setup.sql` e clique em **Run**
3. Todas as tabelas, triggers e políticas serão criados

## 3. Configurar as credenciais no app

Abra o arquivo `js/config.js` e substitua os placeholders:

```js
const SUPABASE_URL      = 'https://SEU-PROJETO.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGci...sua-chave-aqui...';
```

## 4. Criar o primeiro usuário Admin

1. Acesse `index.html` no navegador (ou pela Vercel)
2. Crie uma conta normalmente pelo formulário de login
   - *Nota: o Supabase enviará um e-mail de confirmação — certifique-se de que o e-mail está confirmado*
3. No **SQL Editor** do Supabase, execute:

```sql
UPDATE public.profiles SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'seu@email.com');
```

4. Recarregue a página — agora você tem acesso total de Administrador

## 5. Deploy na Vercel

1. Faça upload da pasta `sgr-indaiatuba/` para um repositório GitHub
2. Importe o repositório na [Vercel](https://vercel.com)
3. Configure como projeto estático (Framework: **Other**)
4. Clique em **Deploy** — nenhuma variável de ambiente é necessária (credenciais estão em `js/config.js`)

> **Segurança**: o `SUPABASE_ANON_KEY` é público por design — o acesso é controlado pelo Row Level Security (RLS) configurado no banco.

## 6. Estrutura de arquivos

```
sgr-indaiatuba/
├── index.html          # Login
├── dashboard.html      # KPIs + gráficos
├── entradas.html       # Recebimento de materiais + fornecedores
├── producao.html       # Processamento + equipamentos + materiais
├── estoque.html        # Saldo e histórico de movimentações
├── comercial.html      # Vendas + clientes
├── financeiro.html     # Fluxo de caixa + lançamentos
├── rh.html             # Colaboradores + ocorrências
├── css/
│   └── style.css
├── js/
│   └── config.js       # Supabase client + helpers compartilhados
├── supabase-setup.sql  # DDL completo do banco
└── SETUP.md            # Este arquivo
```

## 7. Fluxos automáticos

| Ação do usuário | O sistema faz automaticamente |
|---|---|
| Salvar entrada | INSERT em `estoque_movimentacoes` (tipo: entrada, origem: entrada) |
| Salvar produção | INSERT em `estoque_movimentacoes` (tipo: entrada, origem: producao) |
| Salvar venda | INSERT em `estoque_movimentacoes` (tipo: saida) + INSERT em `financeiro_lancamentos` (receita) |
| Editar entrada/produção/venda | DELETE + re-INSERT nas movimentações relacionadas |
| Excluir entrada/produção | DELETE em `estoque_movimentacoes` onde `origem_id = id` |
| Excluir venda | Reverte estoque + reverte lançamento financeiro |

## 8. Cadastrar metas

Metas são inseridas diretamente via SQL (ou você pode adicionar uma tela de admin):

```sql
INSERT INTO public.metas (indicador, periodo, valor_meta) VALUES
  ('producao',    '2025-06', 50000),  -- 50 toneladas
  ('faturamento', '2025-06', 30000),  -- R$ 30.000
  ('vendas',      '2025-06', 40000);  -- 40 toneladas vendidas
```

## 9. Perfis de acesso

| Perfil | Permissões |
|---|---|
| **admin** | CRUD completo em todas as telas |
| **visitante** | Somente leitura (sem botões de criar/editar/excluir) |
