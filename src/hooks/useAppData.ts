import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../services/supabase';
import type { Obra, Gasto, Funcionario, Chamada, FuncionarioObra } from '../types';

function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

export function useAppData() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [chamadas, setChamadas] = useState<Chamada[]>([]);
  const [funcionarioObras, setFuncionarioObras] = useState<FuncionarioObra[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const [obrasRes, gastosRes, funcionariosRes, chamadasRes, funcionarioObrasRes] = await Promise.all([
        supabase.from('obras').select('*').order('created_at', { ascending: false }),
        supabase.from('gastos').select('*').order('created_at', { ascending: false }),
        supabase.from('funcionarios').select('*').order('name', { ascending: true }),
        supabase.from('chamadas').select('*'),
        supabase.from('funcionario_obras').select('*'),
      ]);

      setObras(obrasRes.data || []);
      setGastos(gastosRes.data || []);
      setFuncionarios(funcionariosRes.data || []);
      setChamadas(chamadasRes.data || []);
      setFuncionarioObras(funcionarioObrasRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addObra = async (name: string, clientName: string) => {
    if (!supabase) return;
    const { data, error } = await supabase.from('obras').insert({ name, client_name: clientName }).select().single();
    if (error) console.error("Erro ao adicionar obra:", error);
    if (!error && data) setObras(prev => [data, ...prev]);
  };

  const deleteObra = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('obras').delete().eq('id', id);
    if (error) console.error("Erro ao deletar obra:", error);
    if (!error) {
      setObras(prev => prev.filter(o => o.id !== id));
      setGastos(prev => prev.filter(g => g.obra_id !== id));
    }
  };

  const addGasto = async (obraId: string, name: string, value: number, category: string, receiptUrl?: string) => {
    if (!supabase) return;
    const { data, error } = await supabase.from('gastos').insert({
      obra_id: obraId,
      name,
      value,
      category,
      receipt_url: receiptUrl || null
    }).select().single();
    if (error) console.error("Erro ao adicionar gasto:", error);
    if (!error && data) setGastos(prev => [data, ...prev]);
  };

  const deleteGasto = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('gastos').delete().eq('id', id);
    if (error) console.error("Erro ao deletar gasto:", error);
    if (!error) setGastos(prev => prev.filter(g => g.id !== id));
  };

  const addFuncionario = async (name: string, dailyWage: number, obraIds: string[] = []) => {
    if (!supabase) return;
    const { data: newFunc, error } = await supabase.from('funcionarios').insert({ name, daily_wage: dailyWage }).select().single();
    if (error) console.error("Erro ao adicionar funcionário:", error);
    if (!error && newFunc) {
      setFuncionarios(prev => [...prev, newFunc]);
      if (obraIds.length > 0) {
        const relations = obraIds.map(oId => ({ funcionario_id: newFunc.id, obra_id: oId }));
        const { data: relData, error: relError } = await supabase.from('funcionario_obras').insert(relations).select();
        if (relError) console.error("Erro ao vincular funcionário:", relError);
        if (relData) setFuncionarioObras(prev => [...prev, ...relData]);
      }
    }
  };

  const deleteFuncionario = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('funcionarios').delete().eq('id', id);
    if (error) console.error("Erro ao deletar funcionário:", error);
    if (!error) {
      setFuncionarios(prev => prev.filter(f => f.id !== id));
      setChamadas(prev => prev.filter(c => c.funcionario_id !== id));
      setFuncionarioObras(prev => prev.filter(fo => fo.funcionario_id !== id));
    }
  };

  const getOrCreateChamada = async (funcionarioId: string, obraId: string) => {
    if (!supabase) return null;
    const weekStart = getWeekStart();
    const existing = chamadas.find(c => c.funcionario_id === funcionarioId && c.obra_id === obraId && c.week_start_date === weekStart);
    if (existing) return existing;

    const newChamada = { funcionario_id: funcionarioId, obra_id: obraId, week_start_date: weekStart };
    const { data, error } = await supabase.from('chamadas').insert(newChamada).select().single();
    if (error) console.error("Erro ao criar chamada:", error);
    if (!error && data) {
      setChamadas(prev => [...prev, data]);
      return data;
    }
    return null;
  };

  const updateChamadaDay = async (funcionarioId: string, obraId: string, day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat', value: number) => {
    if (!supabase) return;
    const weekStart = getWeekStart();
    let chamada = chamadas.find(c => c.funcionario_id === funcionarioId && c.obra_id === obraId && c.week_start_date === weekStart);
    
    if (!chamada) {
      const created = await getOrCreateChamada(funcionarioId, obraId);
      if (created) chamada = created;
    }

    if (chamada) {
      const { data, error } = await supabase.from('chamadas').update({ [day]: value }).eq('id', chamada.id).select().single();
      if (error) console.error("Erro ao atualizar chamada:", error);
      if (!error && data) {
        setChamadas(prev => prev.map(c => c.id === data.id ? data : c));
      }
    }
  };

  const getCurrentWeekChamada = useCallback((funcionarioId: string, obraId: string) => {
    const weekStart = getWeekStart();
    return chamadas.find(c => c.funcionario_id === funcionarioId && c.obra_id === obraId && c.week_start_date === weekStart) || null;
  }, [chamadas]);

  const calcWeekTotal = useCallback((funcionarioId: string, obraId?: string) => {
    const func = funcionarios.find(f => f.id === funcionarioId);
    if (!func) return 0;
    const weekStart = getWeekStart();
    
    if (obraId) {
      const chamada = chamadas.find(c => c.funcionario_id === funcionarioId && c.obra_id === obraId && c.week_start_date === weekStart);
      if (!chamada) return 0;
      const days = chamada.mon + chamada.tue + chamada.wed + chamada.thu + chamada.fri + chamada.sat;
      return days * func.daily_wage;
    } else {
      const chamadasDoFunc = chamadas.filter(c => c.funcionario_id === funcionarioId && c.week_start_date === weekStart);
      let totalDays = 0;
      chamadasDoFunc.forEach(c => {
        totalDays += c.mon + c.tue + c.wed + c.thu + c.fri + c.sat;
      });
      return totalDays * func.daily_wage;
    }
  }, [chamadas, funcionarios]);

  const verificarELancarGastoSemanal = useCallback(async (
    currentObras: Obra[],
    currentFuncionarios: Funcionario[],
    currentChamadas: Chamada[],
    currentFuncObras: FuncionarioObra[]
  ) => {
    if (!supabase) return;
    const weekStartStr = getWeekStart(new Date());
    const saturdayDate = new Date(weekStartStr + 'T00:00:00');
    saturdayDate.setDate(saturdayDate.getDate() + 5);
    saturdayDate.setHours(18, 0, 0, 0);
    
    if (new Date() < saturdayDate) return;

    for (const obra of currentObras) {
      const vinculados = currentFuncObras.filter(fo => fo.obra_id === obra.id).map(fo => fo.funcionario_id);
      if (vinculados.length === 0) continue;
      
      let totalSemana = 0;
      vinculados.forEach(fId => {
        const func = currentFuncionarios.find(f => f.id === fId);
        const chamada = currentChamadas.find(c => c.funcionario_id === fId && c.obra_id === obra.id && c.week_start_date === weekStartStr);
        if (func && chamada) {
          const days = chamada.mon + chamada.tue + chamada.wed + chamada.thu + chamada.fri + chamada.sat;
          totalSemana += days * func.daily_wage;
        }
      });
      
      if (totalSemana > 0) {
        const start = new Date(weekStartStr + 'T00:00:00');
        const end = new Date(start);
        end.setDate(end.getDate() + 5);
        const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const gastoName = `Funcionários — semana de ${fmt(start)} a ${fmt(end)}`;
        
        // Verifica se já não existe este gasto nesta obra
        const { data: existingGasto } = await supabase.from('gastos').select('id').eq('obra_id', obra.id).eq('name', gastoName).single();
        if (!existingGasto) {
          await addGasto(obra.id, gastoName, totalSemana, 'Mão de obra');
        }
      }
    }
  }, []);

  useEffect(() => {
    if (obras.length > 0 && funcionarios.length > 0 && chamadas.length > 0) {
      verificarELancarGastoSemanal(obras, funcionarios, chamadas, funcionarioObras);
    }
  }, [obras, funcionarios, chamadas, funcionarioObras, verificarELancarGastoSemanal]);

  const updateObra = async (id: string, name: string, clientName: string) => {
    if (!supabase) return;
    const { data, error } = await supabase.from('obras').update({ name, client_name: clientName }).eq('id', id).select().single();
    if (!error && data) {
      setObras(prev => prev.map(o => o.id === id ? data : o));
    }
  };

  const getGastosForObra = useCallback((obraId: string) => {
    return gastos.filter(g => g.obra_id === obraId);
  }, [gastos]);

  const updateFuncionario = async (id: string, name: string, dailyWage: number, obraIds: string[] = []) => {
    if (!supabase) return;
    const { data: updatedFunc, error } = await supabase.from('funcionarios').update({ name, daily_wage: dailyWage }).eq('id', id).select().single();
    if (!error && updatedFunc) {
      setFuncionarios(prev => prev.map(f => f.id === id ? updatedFunc : f));

      // Remove old relations
      await supabase.from('funcionario_obras').delete().eq('funcionario_id', id);
      setFuncionarioObras(prev => prev.filter(fo => fo.funcionario_id !== id));

      if (obraIds.length > 0) {
        const relations = obraIds.map(oId => ({ funcionario_id: id, obra_id: oId }));
        const { data: relData } = await supabase.from('funcionario_obras').insert(relations).select();
        if (relData) setFuncionarioObras(prev => [...prev, ...relData]);
      }
    }
  };

  const isOnline = navigator.onLine;
  const syncing = loading;
  const doSync = fetchAll;

  return {
    obras, gastos, funcionarios, chamadas, funcionarioObras, loading,
    isOnline, syncing, doSync,
    getWeekStart, addObra, updateObra, deleteObra, addGasto, deleteGasto, getGastosForObra,
    addFuncionario, updateFuncionario, deleteFuncionario, updateChamadaDay, getCurrentWeekChamada, calcWeekTotal
  };
}
