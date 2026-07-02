import React from 'react';

const DashboardCards = ({ employees, attendance, currentWeekStr }) => {
  // Calculate totals for the current week
  let totalToPay = 0;

  const weekData = attendance[currentWeekStr] || {};

  employees.forEach(emp => {
    const empData = weekData[emp.id] || {};
    let presentDays = 0;
    
    // Count present days (Monday = 1, Saturday = 6)
    for (let day = 1; day <= 6; day++) {
      if (empData[day] === 'present') {
        presentDays++;
      }
    }

    totalToPay += presentDays * emp.dailyRate;
  });

  const avgPay = employees.length > 0 ? totalToPay / employees.length : 0;

  return (
    <div className="dashboard-grid fade-in">
      <div className="glass-panel stat-card">
        <span className="stat-title">Total a Pagar</span>
        <span className="stat-value">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalToPay)}
        </span>
      </div>
      <div className="glass-panel stat-card">
        <span className="stat-title">Média por Funcionário</span>
        <span className="stat-value">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(avgPay)}
        </span>
      </div>
    </div>
  );
};

export default DashboardCards;
