-- Rode este código no SQL Editor do Supabase para liberar o acesso das tabelas

-- Desabilita a proteção temporariamente para facilitar os testes sem login
ALTER TABLE obras DISABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE gastos DISABLE ROW LEVEL SECURITY;
ALTER TABLE funcionario_obras DISABLE ROW LEVEL SECURITY;
ALTER TABLE chamadas DISABLE ROW LEVEL SECURITY;

-- (Opcional) Ou se preferir manter o RLS ligado, crie políticas públicas:
-- CREATE POLICY "Permitir tudo para todos" ON obras FOR ALL USING (true) WITH CHECK (true);
