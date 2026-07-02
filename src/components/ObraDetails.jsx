import React, { useState, useRef } from 'react';
import { useSupabase, getWeekStart } from '../hooks/useSupabase';
import { ArrowLeft, Plus, Upload, Camera, ImageIcon } from 'lucide-react';
import BottomSheet from './BottomSheet';
import { supabase } from '../services/supabase';

export default function ObraDetails({ obra, onBack }) {
  const { gastos, funcionarios, chamadas, funcionarioObras, addGasto, updateChamadaDay } = useSupabase();
  const [tab, setTab] = useState('gastos'); // gastos | funcionarios
  const [filterCat, setFilterCat] = useState(null);
  
  const [showAddGasto, setShowAddGasto] = useState(false);
  const [gastoNome, setGastoNome] = useState('');
  const [gastoValor, setGastoValor] = useState('');
  const [gastoCat, setGastoCat] = useState('');
  
  const [showPickSource, setShowPickSource] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Filtra gastos da obra
  const gastosObra = gastos.filter(g => g.obra_id === obra.id);
  const categorias = Array.from(new Set(gastosObra.map(g => g.categoria)));
  const gastosFiltrados = filterCat ? gastosObra.filter(g => g.categoria === filterCat) : gastosObra;
  const totalFiltrado = gastosFiltrados.reduce((acc, g) => acc + (g.valor || 0), 0);
  const totalGeral = gastosObra.reduce((acc, g) => acc + (g.valor || 0), 0);

  // Filtra funcionários da obra
  const funcsObraIds = funcionarioObras.filter(fo => fo.obra_id === obra.id).map(fo => fo.funcionario_id);
  const equipe = funcionarios.filter(f => funcsObraIds.includes(f.id));

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setShowPickSource(false);
    
    // Simulate upload or actual upload to Supabase storage if bucket exists
    // For now we'll create a local preview URL since bucket might not exist yet
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setUploading(false);
  };

  const handleSaveGasto = async () => {
    if (!gastoNome || !gastoValor || !gastoCat) return;
    await addGasto(obra.id, gastoNome, parseFloat(gastoValor), gastoCat, previewUrl);
    setGastoNome(''); setGastoValor(''); setGastoCat(''); setPreviewUrl(null);
    setShowAddGasto(false);
  };

  const getStatusColor = (val) => {
    if (val === 1) return 'var(--status-green)';
    if (val === 0.5) return 'var(--status-yellow)';
    return 'var(--status-red)';
  };

  const handleToggleDay = (funcId, day) => {
    const start = getWeekStart();
    const c = chamadas.find(ch => ch.funcionario_id === funcId && ch.obra_id === obra.id && ch.semana_inicio === start);
    let current = c ? c[day] : 0;
    
    // 0 -> 1 -> 0.5 -> 0
    let next = 1;
    if (current === 1) next = 0.5;
    if (current === 0.5) next = 0;
    
    updateChamadaDay(funcId, obra.id, day, next);
  };

  return (
    <div className="page-container" style={{ paddingBottom: '2rem' }}>
      <header className="app-header" style={{ padding: '1rem', borderBottom: 'none' }}>
        <button className="btn-outline" onClick={onBack} style={{ padding: '0.5rem', width: 'auto', border: 'none' }}>
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ flex: 1, textAlign: 'center' }}>{obra.nome}</h2>
        <div style={{ width: 40 }} /> {/* spacer */}
      </header>

      {/* TABS INTERNAS */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
        <button 
          style={{ flex: 1, padding: '1rem', background: 'none', border: 'none', color: tab === 'gastos' ? 'var(--neon-orange)' : 'var(--text-muted)', borderBottom: tab === 'gastos' ? '2px solid var(--neon-orange)' : 'none', fontWeight: 'bold' }}
          onClick={() => setTab('gastos')}
        >
          Gastos
        </button>
        <button 
          style={{ flex: 1, padding: '1rem', background: 'none', border: 'none', color: tab === 'funcionarios' ? 'var(--neon-orange)' : 'var(--text-muted)', borderBottom: tab === 'funcionarios' ? '2px solid var(--neon-orange)' : 'none', fontWeight: 'bold' }}
          onClick={() => setTab('funcionarios')}
        >
          Equipe
        </button>
      </div>

      {tab === 'gastos' && (
        <div>
          <div className="glass-card" style={{ textAlign: 'center', borderColor: 'var(--neon-orange)', boxShadow: 'var(--shadow-neon)' }}>
            <p className="text-muted">{filterCat ? `Total em ${filterCat}` : 'Total Gasto Geral'}</p>
            <h1 style={{ color: 'var(--neon-orange)', fontSize: '2.5rem' }}>R$ {totalFiltrado.toFixed(2)}</h1>
            {filterCat && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>Total geral: R$ {totalGeral.toFixed(2)}</p>}
          </div>

          {categorias.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '1rem', marginTop: '1.5rem' }}>
              <button 
                onClick={() => setFilterCat(null)}
                style={{ padding: '6px 12px', borderRadius: 20, background: !filterCat ? 'var(--neon-orange-dim)' : 'transparent', border: '1px solid var(--neon-orange)', color: !filterCat ? 'var(--neon-orange)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}
              >
                Todos
              </button>
              {categorias.map(cat => (
                <button 
                  key={cat} onClick={() => setFilterCat(cat)}
                  style={{ padding: '6px 12px', borderRadius: 20, background: filterCat === cat ? 'var(--neon-orange-dim)' : 'transparent', border: '1px solid var(--neon-orange)', color: filterCat === cat ? 'var(--neon-orange)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          <div style={{ marginTop: '1rem' }}>
            {gastosFiltrados.map(g => (
              <div key={g.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem' }}>{g.nome}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--surface-3)', padding: '2px 8px', borderRadius: 12 }}>{g.categoria}</span>
                </div>
                <h3 style={{ color: 'var(--text-primary)' }}>R$ {g.valor.toFixed(2)}</h3>
              </div>
            ))}
          </div>

          <button className="fab-button" onClick={() => setShowAddGasto(true)}>
            <Plus size={28} />
          </button>
        </div>
      )}

      {tab === 'funcionarios' && (
        <div>
          {equipe.length === 0 ? (
            <p className="text-muted" style={{ textAlign: 'center', marginTop: '2rem' }}>Nenhum funcionário vinculado a esta obra.</p>
          ) : (
            equipe.map(func => {
              const start = getWeekStart();
              const c = chamadas.find(ch => ch.funcionario_id === func.id && ch.obra_id === obra.id && ch.semana_inicio === start) || { seg: 0, ter: 0, qua: 0, qui: 0, sex: 0, sab: 0 };
              const diasTrabalhados = (c.seg || 0) + (c.ter || 0) + (c.qua || 0) + (c.qui || 0) + (c.sex || 0) + (c.sab || 0);
              const totalSemana = diasTrabalhados * func.diaria;

              return (
                <div key={func.id} className="glass-card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ color: 'var(--neon-blue)' }}>{func.nome}</h3>
                    <h3 style={{ color: 'var(--status-green)' }}>R$ {totalSemana.toFixed(2)}</h3>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
                    {['seg', 'ter', 'qua', 'qui', 'sex', 'sab'].map(d => (
                      <button 
                        key={d}
                        onClick={() => handleToggleDay(func.id, d)}
                        style={{ 
                          padding: '10px 4px', 
                          border: 'none', 
                          borderRadius: 8,
                          background: `var(--status-${c[d] === 1 ? 'green' : c[d] === 0.5 ? 'yellow' : 'red'}-dim)`,
                          border: `1px solid ${getStatusColor(c[d])}`,
                          color: getStatusColor(c[d]),
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                          fontSize: '0.7rem'
                        }}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODAL CADASTRAR GASTO */}
      <BottomSheet isOpen={showAddGasto} onClose={() => setShowAddGasto(false)} title="Novo Gasto">
        <div className="input-group">
          <label className="input-label">O que foi comprado?</label>
          <input className="input-field" value={gastoNome} onChange={e => setGastoNome(e.target.value)} placeholder="Ex: Cimento, Prego..." />
        </div>
        <div className="input-group">
          <label className="input-label">Valor (R$)</label>
          <input className="input-field" type="number" value={gastoValor} onChange={e => setGastoValor(e.target.value)} placeholder="0.00" />
        </div>
        <div className="input-group">
          <label className="input-label">Categoria</label>
          <input className="input-field" value={gastoCat} onChange={e => setGastoCat(e.target.value)} placeholder="Ex: Material, Mão de obra" list="cat-list"/>
          <datalist id="cat-list">
            {categorias.map(c => <option key={c} value={c} />)}
            <option value="Tijolos"/>
            <option value="Cimento"/>
            <option value="Mão de Obra"/>
          </datalist>
        </div>

        <div className="input-group">
          <label className="input-label">Comprovante (opcional)</label>
          {previewUrl ? (
            <img src={previewUrl} style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />
          ) : (
            <button className="btn btn-outline" style={{ borderStyle: 'dashed' }} onClick={() => setShowPickSource(true)}>
              {uploading ? 'Carregando...' : <><Upload size={20} /> Adicionar Foto</>}
            </button>
          )}
        </div>

        <button className="btn btn-primary" onClick={handleSaveGasto}>Salvar Gasto</button>
      </BottomSheet>

      {/* MODAL ESCOLHER FOTO */}
      <BottomSheet isOpen={showPickSource} onClose={() => setShowPickSource(false)} title="Enviar Comprovante">
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={() => cameraInputRef.current?.click()} style={{ flex: 1, flexDirection: 'column', padding: '2rem' }}>
            <Camera size={32} style={{ color: 'var(--neon-orange)', marginBottom: 8 }} />
            Câmera
          </button>
          <button className="btn btn-outline" onClick={() => fileInputRef.current?.click()} style={{ flex: 1, flexDirection: 'column', padding: '2rem' }}>
            <ImageIcon size={32} style={{ color: 'var(--neon-blue)', marginBottom: 8 }} />
            Galeria
          </button>
        </div>
        <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
        <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
      </BottomSheet>
    </div>
  );
}
