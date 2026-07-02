import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

// Helper: Pega a segunda-feira da semana atual
export function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Dom, 1=Seg...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

export function useSupabase() {
  const [obras, setObras] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [funcionarioObras, setFuncionarioObras] = useState([]);
  const [chamadas, setChamadas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: oData },
        { data: fData },
        { data: gData },
        { data: foData },
        { data: cData }
      ] = await Promise.all([
        supabase.from('obras').select('*').order('criado_em', { ascending: false }),
        supabase.from('funcionarios').select('*').order('nome'),
        supabase.from('gastos').select('*').order('criado_em', { ascending: false }),
        supabase.from('funcionario_obras').select('*'),
        supabase.from('chamadas').select('*')
      ]);

      setObras(oData || []);
      setFuncionarios(fData || []);
      setGastos(gData || []);
      setFuncionarioObras(foData || []);
      setChamadas(cData || []);
      
      // Validação de lançamento semanal automático (roda em background)
      setTimeout(() => checkWeeklyExpenses(oData, fData, cData, foData), 1000);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkWeeklyExpenses = async (currObras, currFuncs, currChamadas, currFO) => {
    // 1. Pegar semana passada
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekStr = getWeekStart(lastWeek);

    // 2. Verificar se já lançamos gastos pra essa semana
    const { data: lancados } = await supabase.from('gastos').select('nome').like('nome', `%semana de ${lastWeekStr}%`);
    if (lancados && lancados.length > 0) return; // já rodou

    // 3. Se não, calcular totais por obra e gerar os gastos
    currObras?.forEach(async obra => {
      let totalMaoDeObra = 0;
      const equipeIds = currFO?.filter(fo => fo.obra_id === obra.id).map(fo => fo.funcionario_id) || [];
      
      equipeIds.forEach(fId => {
        const f = currFuncs?.find(func => func.id === fId);
        const c = currChamadas?.find(ch => ch.obra_id === obra.id && ch.funcionario_id === fId && ch.semana_inicio === lastWeekStr);
        if (f && c) {
          const dias = (c.seg || 0) + (c.ter || 0) + (c.qua || 0) + (c.qui || 0) + (c.sex || 0) + (c.sab || 0);
          totalMaoDeObra += dias * f.diaria;
        }
      });

      if (totalMaoDeObra > 0) {
        await supabase.from('gastos').insert([{
          obra_id: obra.id,
          nome: `Funcionários — semana de ${lastWeekStr}`,
          valor: totalMaoDeObra,
          categoria: 'Mão de obra'
        }]);
      }
    });
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Funções Obras
  const addObra = async (nome, cliente_nome) => {
    const { data, error } = await supabase
      .from('obras')
      .insert([{ nome, cliente_nome }])
      .select()
      .single();
    if (error) {
      alert(`Erro ao salvar obra no Supabase: ${error.message}. As tabelas já foram criadas?`);
    } else if (data) {
      setObras(prev => [data, ...prev]);
    }
  };

  // Funções Gastos
  const addGasto = async (obra_id, nome, valor, categoria, foto_url = null) => {
    const { data, error } = await supabase
      .from('gastos')
      .insert([{ obra_id, nome, valor, categoria, foto_url }])
      .select()
      .single();
    if (error) {
      alert(`Erro ao salvar gasto no Supabase: ${error.message}`);
    } else if (data) {
      setGastos(prev => [data, ...prev]);
    }
  };

  // Funções Funcionários
  const addFuncionario = async (nome, diaria, obraIds = []) => {
    const { data: func, error } = await supabase
      .from('funcionarios')
      .insert([{ nome, diaria }])
      .select()
      .single();
      
    if (error) {
      alert(`Erro ao salvar funcionário no Supabase: ${error.message}`);
    } else if (func) {
      setFuncionarios(prev => [...prev, func]);
      
      // Vincula às obras
      if (obraIds.length > 0) {
        const rels = obraIds.map(oid => ({ funcionario_id: func.id, obra_id: oid }));
        const { error: foError, data: foData } = await supabase.from('funcionario_obras').insert(rels).select();
        if (foError) alert(`Erro ao vincular funcionário à obra: ${foError.message}`);
        else if (foData) setFuncionarioObras(prev => [...prev, ...foData]);
      }
    }
  };

  // Funções Chamada
  const updateChamadaDay = async (funcionario_id, obra_id, dia, valor) => {
    const semana_inicio = getWeekStart();
    const existing = chamadas.find(
      c => c.funcionario_id === funcionario_id && c.obra_id === obra_id && c.semana_inicio === semana_inicio
    );

    if (existing) {
      const { data } = await supabase
        .from('chamadas')
        .update({ [dia]: valor })
        .eq('id', existing.id)
        .select()
        .single();
      if (data) {
        setChamadas(prev => prev.map(c => c.id === data.id ? data : c));
      }
    } else {
      const { data } = await supabase
        .from('chamadas')
        .insert([{ funcionario_id, obra_id, semana_inicio, [dia]: valor }])
        .select()
        .single();
      if (data) {
        setChamadas(prev => [...prev, data]);
      }
    }
  };

  return {
    obras,
    funcionarios,
    gastos,
    funcionarioObras,
    chamadas,
    loading,
    addObra,
    addGasto,
    addFuncionario,
    updateChamadaDay
  };
}
