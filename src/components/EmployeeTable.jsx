import React from 'react';
import { Trash2 } from 'lucide-react';

const DAYS_OF_WEEK = [
  { id: 1, name: 'Segunda' },
  { id: 2, name: 'Terça' },
  { id: 3, name: 'Quarta' },
  { id: 4, name: 'Quinta' },
  { id: 5, name: 'Sexta' },
  { id: 6, name: 'Sábado' },
];

const EmployeeTable = ({
  employees,
  attendance,
  currentWeekStr,
  onUpdateEmployee,
  onRemoveEmployee,
  onToggleAttendance,
}) => {
  const weekData = attendance[currentWeekStr] || {};

  const handleStatusClick = (empId, dayId) => {
    const empData = weekData[empId] || {};
    const currentStatus = empData[dayId];
    
    let newStatus = null;
    if (currentStatus === null || currentStatus === undefined) newStatus = 'present';
    else if (currentStatus === 'present') newStatus = 'half';
    else if (currentStatus === 'half') newStatus = 'absent';
    else if (currentStatus === 'absent') newStatus = null;

    onToggleAttendance(empId, dayId, newStatus);
  };

  const getStatusClass = (status) => {
    if (status === 'present') return 'status-present';
    if (status === 'half') return 'status-half';
    if (status === 'absent') return 'status-absent';
    return 'status-null';
  };

  const getStatusText = (status) => {
    if (status === 'present') return 'P';
    if (status === 'half') return 'M';
    if (status === 'absent') return 'F';
    return '-';
  };

  return (
    <div className="table-container fade-in">
      <table>
        <thead>
          <tr>
            <th>Funcionário</th>
            <th>Diária (R$)</th>
            {DAYS_OF_WEEK.map(day => (
              <th key={day.id} style={{ textAlign: 'center' }}>{day.name}</th>
            ))}
            <th style={{ textAlign: 'right' }}>Total Pago</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => {
            const empData = weekData[emp.id] || {};
            let presentDays = 0;
            
            DAYS_OF_WEEK.forEach(day => {
              if (empData[day.id] === 'present') presentDays += 1;
              else if (empData[day.id] === 'half') presentDays += 0.5;
            });

            const total = presentDays * emp.dailyRate;

            return (
              <tr key={emp.id}>
                <td data-label="Funcionário">
                  <input
                    type="text"
                    className="edit-input"
                    value={emp.name}
                    onChange={(e) => onUpdateEmployee(emp.id, 'name', e.target.value)}
                    placeholder="Nome do Funcionário"
                  />
                </td>
                <td data-label="Diária (R$)">
                  <input
                    type="number"
                    className="edit-input money-input"
                    value={emp.dailyRate}
                    onChange={(e) => onUpdateEmployee(emp.id, 'dailyRate', parseFloat(e.target.value) || 0)}
                  />
                </td>
                {DAYS_OF_WEEK.map(day => {
                  const status = empData[day.id];
                  return (
                    <td key={day.id} data-label={day.name} style={{ textAlign: 'center' }}>
                      <button
                        className={`status-btn ${getStatusClass(status)}`}
                        onClick={() => handleStatusClick(emp.id, day.id)}
                      >
                        {getStatusText(status)}
                      </button>
                    </td>
                  );
                })}
                <td data-label="Total Pago" className="total-cell">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                </td>
                <td data-label="Ações" style={{ textAlign: 'center' }}>
                  <button
                    className="icon-btn delete"
                    onClick={() => onRemoveEmployee(emp.id)}
                    title="Remover Funcionário"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            );
          })}
          {employees.length === 0 && (
            <tr>
              <td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                Nenhum funcionário cadastrado. Adicione um para começar.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeTable;
