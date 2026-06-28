import React, { useState, useRef, useEffect } from 'react';
import { useAppData } from './hooks/useAppData';
import BottomSheet from './components/BottomSheet';
import ObraCard from './components/ObraCard';
import FuncionarioCard from './components/FuncionarioCard';
import ChamadaCard from './components/ChamadaSemanal';
import type { Obra, Gasto, Funcionario } from './types';
import {
  Plus, Building2, Users, ArrowLeft, RefreshCw,
  Package, Trash2, Image, X, HardHat, Pencil, LogOut
} from 'lucide-react';
import { supabase } from './services/supabase';
import Login from './components/Login';

type Tab = 'obras' | 'funcionarios';
type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

const categoryColors = ['#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f97316', '#06b6d4'];
function categoryColor(cat: string) {
  let hash = 0;
  for (let i = 0; i < cat.length; i++) hash = cat.charCodeAt(i) + ((hash << 5) - hash);
  return categoryColors[Math.abs(hash) % categoryColors.length];
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');
}

// ---- Componente de Splash Screen ----
function SplashScreen() {
  return (
    <div className="splash-screen">
      <div className="splash-icon">
        <HardHat size={48} strokeWidth={1.5} />
      </div>
      <h1 className="splash-title">ObraControl</h1>
      <p className="splash-sub">Carregando dados...</p>
      <div className="splash-spinner" />
    </div>
  );
}

export default function App() {
  const data = useAppData();
  const [tab, setTab] = useState<Tab>('obras');
  const [selectedObra, setSelectedObra] = useState<Obra | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  // Abas dentro da obra: 'gastos' ou 'funcionarios'
  const [obraTab, setObraTab] = useState<'gastos' | 'funcionarios'>('gastos');

  // Sessão de Autenticação
  const [session, setSession] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Mostrar splash por pelo menos 800ms
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 800);
    
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setAuthChecking(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });

      return () => {
        clearTimeout(timer);
        subscription.unsubscribe();
      };
    } else {
      setAuthChecking(false);
      return () => clearTimeout(timer);
    }
  }, []);

  // Modais - Obras
  const [showAddObra, setShowAddObra] = useState(false);
  const [newObraName, setNewObraName] = useState('');
  const [newObraClient, setNewObraClient] = useState('');

  // Editar Obra
  const [showEditObra, setShowEditObra] = useState(false);
  const [editObraName, setEditObraName] = useState('');
  const [editObraClient, setEditObraClient] = useState('');

  // Excluir Obra
  const [showDeleteObra, setShowDeleteObra] = useState(false);
  const [obraToAction, setObraToAction] = useState<Obra | null>(null);

  // Modais - Gastos
  const [showAddGasto, setShowAddGasto] = useState(false);
  const [gastoName, setGastoName] = useState('');
  const [gastoValue, setGastoValue] = useState('');
  const [gastoCategory, setGastoCategory] = useState('');
  const [gastoReceipt, setGastoReceipt] = useState<string | null>(null);
  
  // Origem de Foto (Câmera ou Biblioteca)
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [showImageSourcePicker, setShowImageSourcePicker] = useState(false);

  // Modais - Funcionários
  const [showAddFunc, setShowAddFunc] = useState(false);
  const [funcName, setFuncName] = useState('');
  const [funcWage, setFuncWage] = useState('');
  const [selectedObrasForFunc, setSelectedObrasForFunc] = useState<string[]>([]);

  // Modais - Gasto detalhe
  const [selectedGasto, setSelectedGasto] = useState<Gasto | null>(null);
  const [showDeleteGasto, setShowDeleteGasto] = useState(false);

  // ---- Handlers ----
  const handleAddObra = () => {
    if (!newObraName.trim() || !newObraClient.trim()) return;
    data.addObra(newObraName.trim(), newObraClient.trim());
    setNewObraName(''); setNewObraClient('');
    setShowAddObra(false);
  };

  const handleEditObra = () => {
    if (!obraToAction || !editObraName.trim() || !editObraClient.trim()) return;
    data.updateObra(obraToAction.id, editObraName.trim(), editObraClient.trim());
    setShowEditObra(false);
    setObraToAction(null);
    // Atualiza o selectedObra se for a que está aberta
    if (selectedObra?.id === obraToAction.id) {
      setSelectedObra(prev => prev ? { ...prev, name: editObraName.trim(), client_name: editObraClient.trim() } : prev);
    }
  };

  const handleDeleteObra = () => {
    if (!obraToAction) return;
    data.deleteObra(obraToAction.id);
    setShowDeleteObra(false);
    if (selectedObra?.id === obraToAction.id) setSelectedObra(null);
    setObraToAction(null);
  };

  const handleAddGasto = () => {
    if (!selectedObra || !gastoName.trim() || !gastoCategory.trim()) return;
    const val = parseFloat(gastoValue.replace(',', '.'));
    if (isNaN(val) || val <= 0) return;
    data.addGasto(selectedObra.id, gastoName.trim(), val, gastoCategory.trim(), gastoReceipt || undefined);
    setGastoName(''); setGastoValue(''); setGastoCategory(''); setGastoReceipt(null);
    setShowAddGasto(false);
  };

  const handleAddFuncionario = () => {
    if (!funcName.trim()) return;
    const wage = parseFloat(funcWage.replace(',', '.'));
    if (isNaN(wage) || wage <= 0) return;
    data.addFuncionario(funcName.trim(), wage, selectedObrasForFunc);
    setFuncName(''); setFuncWage(''); setSelectedObrasForFunc([]);
    setShowAddFunc(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => { setGastoReceipt(reader.result as string); };
    reader.readAsDataURL(file);
  };

  const handleDeleteGasto = () => {
    if (!selectedGasto) return;
    data.deleteGasto(selectedGasto.id);
    setSelectedGasto(null);
    setShowDeleteGasto(false);
  };

  if (!isReady || authChecking) return <SplashScreen />;

  // Se o Supabase estiver configurado e não houver sessão ativa, mostra o Login
  if (supabase && !session) {
    return <Login />;
  }

  // ---- Tela Interna de Obra ----
  if (selectedObra) {
    const gastosDaObra = data.getGastosForObra(selectedObra.id);
    const categories = Array.from(new Set(gastosDaObra.map(g => g.category)));
    const filtered = filterCategory
      ? gastosDaObra.filter(g => g.category === filterCategory)
      : gastosDaObra;
    const total = filtered.reduce((sum, g) => sum + g.value, 0);
    const totalGeral = gastosDaObra.reduce((sum, g) => sum + g.value, 0);

    return (
      <div className="app-container">
        {/* Header */}
        <div className="page-header" style={{ paddingBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <button className="back-btn" onClick={() => { setSelectedObra(null); setFilterCategory(null); setObraTab('gastos'); }}>
              <ArrowLeft size={16} />
              Obras
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="sync-indicator">
                <span className={`sync-dot ${!data.isOnline ? 'offline' : data.syncing ? 'syncing' : ''}`} />
                {data.isOnline ? (data.syncing ? 'Sinc...' : 'Online') : 'Offline'}
              </span>
              <button
                className="icon-btn"
                onClick={() => {
                  setObraToAction(selectedObra);
                  setEditObraName(selectedObra.name);
                  setEditObraClient(selectedObra.client_name);
                  setShowEditObra(true);
                }}
                title="Editar obra"
              >
                <Pencil size={15} />
              </button>
              <button
                className="icon-btn danger"
                onClick={() => { setObraToAction(selectedObra); setShowDeleteObra(true); }}
                title="Excluir obra"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div className="obra-avatar">
              {getInitials(selectedObra.name)}
            </div>
            <div>
              <h1 style={{ fontSize: '1.2rem', marginBottom: 2 }}>{selectedObra.name}</h1>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                Cliente: {selectedObra.client_name}
              </p>
            </div>
          </div>

          {/* Abas internas da obra */}
          <div style={{ display: 'flex', borderTop: '1px solid var(--color-border)', marginTop: 8 }}>
            <button
              style={{
                flex: 1,
                padding: '10px',
                background: 'none',
                border: 'none',
                borderBottom: obraTab === 'gastos' ? '2.5px solid var(--color-primary)' : 'none',
                color: obraTab === 'gastos' ? 'var(--color-primary-light)' : 'var(--color-text-secondary)',
                fontWeight: obraTab === 'gastos' ? 700 : 500,
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
              onClick={() => setObraTab('gastos')}
            >
              Gastos
            </button>
            <button
              style={{
                flex: 1,
                padding: '10px',
                background: 'none',
                border: 'none',
                borderBottom: obraTab === 'funcionarios' ? '2.5px solid var(--color-primary)' : 'none',
                color: obraTab === 'funcionarios' ? 'var(--color-primary-light)' : 'var(--color-text-secondary)',
                fontWeight: obraTab === 'funcionarios' ? 700 : 500,
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
              onClick={() => setObraTab('funcionarios')}
            >
              Funcionários
            </button>
          </div>
        </div>

        <div className="page-content">
          {obraTab === 'gastos' ? (
            <>
              {/* Cards de Totais */}
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-label">{filterCategory ? `Total em "${filterCategory}"` : 'Total Gasto'}</div>
                  <div className="stat-value">{formatCurrency(total)}</div>
                </div>
                {filterCategory && (
                  <div className="stat-card secondary">
                    <div className="stat-label">Total Geral</div>
                    <div className="stat-value secondary">{formatCurrency(totalGeral)}</div>
                  </div>
                )}
              </div>

              {/* Filtros de categoria */}
              {categories.length > 0 && (
                <div className="filter-chips">
                  <button
                    className={`chip ${!filterCategory ? 'active' : ''}`}
                    onClick={() => setFilterCategory(null)}
                  >
                    Todos ({gastosDaObra.length})
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      className={`chip ${filterCategory === cat ? 'active' : ''}`}
                      style={{ borderLeftColor: categoryColor(cat), borderLeftWidth: 3 }}
                      onClick={() => setFilterCategory(cat === filterCategory ? null : cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Lista de Gastos */}
              {filtered.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><Package size={28} /></div>
                  <h3>Nenhum gasto registrado</h3>
                  <p>{filterCategory ? `Nenhum gasto em "${filterCategory}"` : 'Toque no + para adicionar o primeiro gasto'}</p>
                </div>
              ) : (
                <div>
                  {filtered.map(gasto => (
                    <div
                      key={gasto.id}
                      className="gasto-item"
                      onClick={() => { setSelectedGasto(gasto); setShowDeleteGasto(true); }}
                    >
                      <div className="gasto-dot" style={{ background: categoryColor(gasto.category) }} />
                      <div className="gasto-info">
                        <div className="gasto-name">{gasto.name}</div>
                        <div className="gasto-meta">
                          <span className="gasto-cat-badge" style={{ color: categoryColor(gasto.category) }}>
                            {gasto.category}
                          </span>
                          <span>·</span>
                          <span>{formatDate(gasto.created_at)}</span>
                        </div>
                        {gasto.receipt_url && (
                          <img src={gasto.receipt_url} alt="Comprovante" className="receipt-preview" />
                        )}
                      </div>
                      <div className="gasto-value">{formatCurrency(gasto.value)}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (() => {
            const vinculados = data.funcionarioObras
              .filter(fo => fo.obra_id === selectedObra.id)
              .map(fo => data.funcionarios.find(f => f.id === fo.funcionario_id))
              .filter((f): f is Funcionario => !!f);

            return (
              <>
                {vinculados.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon"><Users size={32} /></div>
                    <h3>Nenhum funcionário vinculado</h3>
                    <p>Vincule funcionários a esta obra a partir do cadastro de funcionários global ou crie um novo tocando no + abaixo.</p>
                  </div>
                ) : (
                  <>
                    {/* Chamada Semanal */}
                    <div className="section-label">📋 Chamada da Semana</div>
                    <div style={{ marginBottom: '1.5rem' }}>
                      {vinculados.map(func => (
                        <ChamadaCard
                          key={func.id}
                          funcionario={func}
                          chamada={data.getCurrentWeekChamada(func.id, selectedObra.id)}
                          weekTotal={data.calcWeekTotal(func.id, selectedObra.id)}
                          onUpdateDay={(day: DayKey, value: number) =>
                            data.updateChamadaDay(func.id, selectedObra.id, day, value)
                          }
                        />
                      ))}
                    </div>

                    {/* Seção de Gerenciamento */}
                    <div className="section-label">👷 Funcionários da Obra</div>
                    {vinculados.map(func => (
                      <FuncionarioCard
                        key={func.id}
                        funcionario={func}
                        weekTotal={data.calcWeekTotal(func.id, selectedObra.id)}
                        obras={data.obras}
                        vinculos={data.funcionarioObras.filter(fo => fo.funcionario_id === func.id).map(fo => fo.obra_id)}
                        onUpdate={(name, wage, ids) => data.updateFuncionario(func.id, name, wage, ids)}
                        onDelete={() => data.deleteFuncionario(func.id)}
                      />
                    ))}
                  </>
                )}
              </>
            );
          })()}
        </div>

        {/* FAB */}
        <button
          className="fab"
          onClick={() => {
            if (obraTab === 'gastos') {
              setShowAddGasto(true);
            } else {
              setSelectedObrasForFunc([selectedObra.id]);
              setShowAddFunc(true);
            }
          }}
          aria-label={obraTab === 'gastos' ? 'Adicionar gasto' : 'Adicionar funcionário'}
        >
          <Plus size={24} />
        </button>

        {/* Modal Adicionar Gasto */}
        <BottomSheet isOpen={showAddGasto} onClose={() => setShowAddGasto(false)} title="Novo Gasto">
          <div className="form-group">
            <label className="form-label">Nome do gasto</label>
            <input className="form-input" value={gastoName} onChange={e => setGastoName(e.target.value)} placeholder="Ex: Cimento CP-II, Tijolo..." />
          </div>
          <div className="form-group">
            <label className="form-label">Valor (R$)</label>
            <input className="form-input" type="number" step="0.01" min="0" value={gastoValue} onChange={e => setGastoValue(e.target.value)} placeholder="0,00" />
          </div>
          <div className="form-group">
            <label className="form-label">Categoria</label>
            <input className="form-input" value={gastoCategory} onChange={e => setGastoCategory(e.target.value)} list="categorias-list" placeholder="Ex: Material, Mão de Obra..." />
            <datalist id="categorias-list">
              {Array.from(new Set(gastosDaObra.map(g => g.category))).map(c => (
                <option key={c} value={c} />
              ))}
              {['Tijolos', 'Cimento', 'Mão de Obra', 'Ferramentas', 'Areia', 'Ferro', 'Tinta', 'Elétrica', 'Hidráulica'].map(c => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="form-group">
            <label className="form-label">Comprovante (opcional)</label>
            <div className="file-upload-area" onClick={() => setShowImageSourcePicker(true)}>
              {gastoReceipt ? (
                <div>
                  <img src={gastoReceipt} alt="Comprovante" style={{ maxHeight: 100, borderRadius: 8, marginBottom: 8 }} />
                  <button
                    style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '0.8rem' }}
                    onClick={e => { e.stopPropagation(); setGastoReceipt(null); }}
                  >
                    <X size={12} /> Remover
                  </button>
                </div>
              ) : (
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                  <Image size={20} style={{ marginBottom: 4 }} />
                  <div>Tirar foto ou selecionar da galeria</div>
                </div>
              )}
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: 'none' }} />
              <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleAddGasto}>Salvar Gasto</button>
        </BottomSheet>

        {/* Modal Detalhe/Excluir Gasto */}
        <BottomSheet isOpen={showDeleteGasto} onClose={() => setShowDeleteGasto(false)} title="Detalhes do Gasto">
          {selectedGasto && (
            <>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: categoryColor(selectedGasto.category), flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8rem', color: categoryColor(selectedGasto.category), fontWeight: 600 }}>{selectedGasto.category}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>{formatDate(selectedGasto.created_at)}</span>
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>{selectedGasto.name}</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary-light)', letterSpacing: '-0.02em' }}>{formatCurrency(selectedGasto.value)}</div>
                {selectedGasto.receipt_url && (
                  <img src={selectedGasto.receipt_url} alt="Comprovante" className="receipt-preview" style={{ marginTop: 12, maxHeight: 200 }} />
                )}
              </div>
              <button className="btn btn-danger" onClick={handleDeleteGasto}>
                <Trash2 size={16} />
                Excluir Gasto
              </button>
              <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => setShowDeleteGasto(false)}>Fechar</button>
            </>
          )}
        </BottomSheet>

        {/* Modal Editar Obra */}
        <BottomSheet isOpen={showEditObra} onClose={() => setShowEditObra(false)} title="Editar Obra">
          <div className="form-group">
            <label className="form-label">Nome da Obra</label>
            <input className="form-input" value={editObraName} onChange={e => setEditObraName(e.target.value)} placeholder="Ex: Residência João Silva" />
          </div>
          <div className="form-group">
            <label className="form-label">Nome do Cliente</label>
            <input className="form-input" value={editObraClient} onChange={e => setEditObraClient(e.target.value)} placeholder="Ex: João Silva" />
          </div>
          <button className="btn btn-primary" onClick={handleEditObra}>Salvar Alterações</button>
        </BottomSheet>

        {/* Modal Excluir Obra */}
        <BottomSheet isOpen={showDeleteObra} onClose={() => setShowDeleteObra(false)} title="Excluir Obra">
          <p style={{ marginBottom: 20, color: 'var(--color-text-secondary)' }}>
            Tem certeza que deseja excluir <strong style={{ color: 'var(--color-text-primary)' }}>"{obraToAction?.name}"</strong>? Todos os gastos desta obra serão apagados. Esta ação não pode ser desfeita.
          </p>
          <button className="btn btn-danger" onClick={handleDeleteObra}>
            <Trash2 size={16} />
            Sim, excluir obra
          </button>
          <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => setShowDeleteObra(false)}>Cancelar</button>
        </BottomSheet>

        <nav className="bottom-nav">
          <button className="nav-item active">
            <Building2 size={22} />
            <span>Obra</span>
          </button>
        </nav>
      </div>
    );
  }

  // ---- Tela Principal ----
  const totalGeral = data.gastos.reduce((sum, g) => sum + g.value, 0);

  return (
    <div className="app-container">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="logo-icon">
              <HardHat size={18} strokeWidth={2} color="#0d0f14" />
            </div>
            <div>
              <h1>ObraControl</h1>
              <p className="header-sub">Gestão de obras simplificada</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="sync-indicator">
              <span className={`sync-dot ${!data.isOnline ? 'offline' : data.syncing ? 'syncing' : ''}`} />
              {data.isOnline ? (data.syncing ? 'Sinc...' : 'Online') : 'Offline'}
            </span>
            {data.isOnline && (
              <button
                onClick={() => data.doSync()}
                className="icon-btn"
                title="Sincronizar agora"
              >
                <RefreshCw size={15} style={{ animation: data.syncing ? 'spin 1s linear infinite' : 'none' }} />
              </button>
            )}
            {session && (
              <button
                onClick={() => supabase?.auth.signOut()}
                className="icon-btn danger"
                title="Sair (Logout)"
                style={{ marginLeft: 4 }}
              >
                <LogOut size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Resumo rápido - apenas na aba Obras */}
        {tab === 'obras' && data.obras.length > 0 && (
          <div className="header-summary">
            <div className="summary-item">
              <span className="summary-label">Obras</span>
              <span className="summary-value">{data.obras.length}</span>
            </div>
            <div className="summary-divider" />
            <div className="summary-item">
              <span className="summary-label">Total Investido</span>
              <span className="summary-value primary">{formatCurrency(totalGeral)}</span>
            </div>
          </div>
        )}

        {tab === 'funcionarios' && data.funcionarios.length > 0 && (() => {
          const weekStart = new Date(data.getWeekStart() + 'T00:00:00');
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 5);
          const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
          const totalSemana = data.funcionarios.reduce((sum, f) => sum + data.calcWeekTotal(f.id), 0);
          return (
            <div className="header-summary">
              <div className="summary-item">
                <span className="summary-label">Semana</span>
                <span className="summary-value" style={{ fontSize: '0.8rem' }}>{fmt(weekStart)} – {fmt(weekEnd)}</span>
              </div>
              <div className="summary-divider" />
              <div className="summary-item">
                <span className="summary-label">Total Semana</span>
                <span className="summary-value primary">{formatCurrency(totalSemana)}</span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Conteúdo */}
      <div className="page-content">
        {/* Aba Obras */}
        {tab === 'obras' && (
          <>
            {data.obras.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><Building2 size={32} /></div>
                <h3>Nenhuma obra cadastrada</h3>
                <p>Toque no <strong>+</strong> abaixo para cadastrar sua primeira obra</p>
                <button className="btn btn-primary" style={{ marginTop: 16, width: 'auto', padding: '10px 24px' }} onClick={() => setShowAddObra(true)}>
                  <Plus size={16} /> Nova Obra
                </button>
              </div>
            ) : (
              data.obras.map(obra => (
                <ObraCard
                  key={obra.id}
                  obra={obra}
                  gastos={data.gastos}
                  onClick={() => setSelectedObra(obra)}
                  onDelete={() => { setObraToAction(obra); setShowDeleteObra(true); }}
                  onEdit={() => {
                    setObraToAction(obra);
                    setEditObraName(obra.name);
                    setEditObraClient(obra.client_name);
                    setShowEditObra(true);
                  }}
                />
              ))
            )}
          </>
        )}

        {/* Aba Funcionários */}
        {tab === 'funcionarios' && (
          <>
            {data.funcionarios.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><Users size={32} /></div>
                <h3>Nenhum funcionário cadastrado</h3>
                <p>Toque no <strong>+</strong> abaixo para cadastrar um funcionário</p>
                <button className="btn btn-primary" style={{ marginTop: 16, width: 'auto', padding: '10px 24px' }} onClick={() => { setSelectedObrasForFunc([]); setShowAddFunc(true); }}>
                  <Plus size={16} /> Novo Funcionário
                </button>
              </div>
            ) : (
              <>
                {/* Seção de Gerenciamento */}
                <div className="section-label">👷 Todos os Funcionários</div>
                {data.funcionarios.map(func => (
                  <FuncionarioCard
                    key={func.id}
                    funcionario={func}
                    weekTotal={data.calcWeekTotal(func.id)}
                    obras={data.obras}
                    vinculos={data.funcionarioObras.filter(fo => fo.funcionario_id === func.id).map(fo => fo.obra_id)}
                    onUpdate={(name, wage, ids) => data.updateFuncionario(func.id, name, wage, ids)}
                    onDelete={() => data.deleteFuncionario(func.id)}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* FAB */}
      <button
        className="fab"
        onClick={() => {
          if (tab === 'obras') {
            setShowAddObra(true);
          } else {
            setSelectedObrasForFunc([]);
            setShowAddFunc(true);
          }
        }}
        aria-label={tab === 'obras' ? 'Adicionar obra' : 'Adicionar funcionário'}
      >
        <Plus size={24} />
      </button>

      {/* Modal Adicionar Obra */}
      <BottomSheet isOpen={showAddObra} onClose={() => setShowAddObra(false)} title="Nova Obra">
        <div className="form-group">
          <label className="form-label">Nome da Obra</label>
          <input className="form-input" value={newObraName} onChange={e => setNewObraName(e.target.value)} placeholder="Ex: Residência João Silva" autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">Nome do Cliente</label>
          <input className="form-input" value={newObraClient} onChange={e => setNewObraClient(e.target.value)} placeholder="Ex: João Silva" />
        </div>
        <button className="btn btn-primary" onClick={handleAddObra}>Salvar Obra</button>
      </BottomSheet>

      {/* Modal Editar Obra */}
      <BottomSheet isOpen={showEditObra} onClose={() => setShowEditObra(false)} title="Editar Obra">
        <div className="form-group">
          <label className="form-label">Nome da Obra</label>
          <input className="form-input" value={editObraName} onChange={e => setEditObraName(e.target.value)} placeholder="Ex: Residência João Silva" />
        </div>
        <div className="form-group">
          <label className="form-label">Nome do Cliente</label>
          <input className="form-input" value={editObraClient} onChange={e => setEditObraClient(e.target.value)} placeholder="Ex: João Silva" />
        </div>
        <button className="btn btn-primary" onClick={handleEditObra}>Salvar Alterações</button>
      </BottomSheet>

      {/* Modal Excluir Obra */}
      <BottomSheet isOpen={showDeleteObra} onClose={() => setShowDeleteObra(false)} title="Excluir Obra">
        <p style={{ marginBottom: 20, color: 'var(--color-text-secondary)' }}>
          Tem certeza que deseja excluir <strong style={{ color: 'var(--color-text-primary)' }}>"{obraToAction?.name}"</strong>? Todos os gastos desta obra serão apagados. Esta ação não pode ser desfeita.
        </p>
        <button className="btn btn-danger" onClick={handleDeleteObra}>
          <Trash2 size={16} />
          Sim, excluir obra
        </button>
        <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => setShowDeleteObra(false)}>Cancelar</button>
      </BottomSheet>

      {/* Modal Adicionar Funcionário */}
      <BottomSheet isOpen={showAddFunc} onClose={() => { setShowAddFunc(false); setSelectedObrasForFunc([]); }} title="Novo Funcionário">
        <div className="form-group">
          <label className="form-label">Nome</label>
          <input className="form-input" value={funcName} onChange={e => setFuncName(e.target.value)} placeholder="Ex: Carlos Pereira" autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">Valor da Diária (R$)</label>
          <input className="form-input" type="number" step="0.01" min="0" value={funcWage} onChange={e => setFuncWage(e.target.value)} placeholder="0,00" />
        </div>
        <div className="form-group">
          <label className="form-label">Vincular a Obras</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, maxHeight: 150, overflowY: 'auto', padding: '4px 0' }}>
            {data.obras.length === 0 ? (
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Nenhuma obra cadastrada.</span>
            ) : (
              data.obras.map(o => (
                <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--color-text-primary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedObrasForFunc.includes(o.id)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedObrasForFunc(prev => [...prev, o.id]);
                      } else {
                        setSelectedObrasForFunc(prev => prev.filter(id => id !== o.id));
                      }
                    }}
                  />
                  {o.name}
                </label>
              ))
            )}
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleAddFuncionario}>Salvar Funcionário</button>
      </BottomSheet>

      {/* Navegação Inferior */}
      <nav className="bottom-nav">
        <button className={`nav-item ${tab === 'obras' ? 'active' : ''}`} onClick={() => setTab('obras')}>
          <Building2 size={22} />
          <span>Obras</span>
        </button>
        <button className={`nav-item ${tab === 'funcionarios' ? 'active' : ''}`} onClick={() => setTab('funcionarios')}>
          <Users size={22} />
          <span>Funcionários</span>
        </button>
      </nav>

      {/* BottomSheet para escolher origem da foto */}
      <BottomSheet isOpen={showImageSourcePicker} onClose={() => setShowImageSourcePicker(false)} title="Origem da Imagem">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => { setShowImageSourcePicker(false); cameraInputRef.current?.click(); }}>
            📸 Tirar Foto (Câmera)
          </button>
          <button className="btn btn-ghost" onClick={() => { setShowImageSourcePicker(false); galleryInputRef.current?.click(); }}>
            🖼️ Escolher da Galeria
          </button>
        </div>
      </BottomSheet>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
