import React from 'react';
import type { Funcionario, Chamada } from '../types';

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

const DAY_LABELS: { key: DayKey; label: string }[] = [
  { key: 'mon', label: 'Seg' },
  { key: 'tue', label: 'Ter' },
  { key: 'wed', label: 'Qua' },
  { key: 'thu', label: 'Qui' },
  { key: 'fri', label: 'Sex' },
  { key: 'sat', label: 'Sáb' },
];

// Ciclo de status: 0 (faltou) → 1 (presente) → 0.5 (meio)
function nextStatus(current: number): number {
  if (current === 0) return 1;
  if (current === 1) return 0.5;
  return 0;
}

function getStatusClass(value: number): string {
  if (value === 1) return 'status-full';
  if (value === 0.5) return 'status-half';
  return 'status-0';
}

function getStatusEmoji(value: number): string {
  if (value === 1) return '✓';
  if (value === 0.5) return '½';
  return '✗';
}

interface ChamadaCardProps {
  funcionario: Funcionario;
  chamada: Chamada | null;
  weekTotal: number;
  onUpdateDay: (day: DayKey, value: number) => void;
}

const ChamadaCard: React.FC<ChamadaCardProps> = ({
  funcionario,
  chamada,
  weekTotal,
  onUpdateDay,
}) => {
  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const getDayValue = (day: DayKey): number => {
    if (!chamada) return 0;
    return chamada[day];
  };

  const handleDayClick = (day: DayKey) => {
    const current = getDayValue(day);
    const next = nextStatus(current);
    onUpdateDay(day, next);
  };

  return (
    <div className="chamada-card">
      <div className="func-name">{funcionario.name}</div>
      <div className="func-total">
        Semana: {formatCurrency(weekTotal)} · Diária: {formatCurrency(funcionario.daily_wage)}
      </div>
      <div className="chamada-days">
        {DAY_LABELS.map(({ key, label }) => {
          const value = getDayValue(key);
          return (
            <button
              key={key}
              className={`day-btn ${getStatusClass(value)}`}
              onClick={() => handleDayClick(key)}
              title={value === 1 ? 'Presente' : value === 0.5 ? 'Meio período' : 'Faltou'}
            >
              <span className="day-label">{label}</span>
              <span className="day-status">{getStatusEmoji(value)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ChamadaCard;
