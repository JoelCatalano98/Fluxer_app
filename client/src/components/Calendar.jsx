import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const days = [];
  // Celdas vacías para los días antes del inicio del mes
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
  }

  // Celdas para los días del mes
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = 
      d === new Date().getDate() && 
      currentDate.getMonth() === new Date().getMonth() && 
      currentDate.getFullYear() === new Date().getFullYear();

    days.push(
      <div key={d} className={`calendar-day ${isToday ? 'today' : ''}`}>
        <span className="day-number">{d}</span>
        {/* Placeholder para eventos/turnos */}
        {d % 5 === 0 && <div className="event-dot"></div>}
      </div>
    );
  }

  return (
    <div className="custom-calendar">
      <div className="calendar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, textTransform: 'capitalize', fontSize: '1.4rem' }}>
          {months[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <div className="calendar-nav" style={{ display: 'flex', gap: '10px' }}>
          <button onClick={prevMonth} style={{ padding: '8px', borderRadius: '50%', border: '1px solid #ddd', background: 'white', cursor: 'pointer', display: 'flex' }}><ChevronLeft size={20} /></button>
          <button onClick={nextMonth} style={{ padding: '8px', borderRadius: '50%', border: '1px solid #ddd', background: 'white', cursor: 'pointer', display: 'flex' }}><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
        {daysOfWeek.map(day => (
          <div key={day} className="calendar-weekday" style={{ textAlign: 'center', fontWeight: '700', padding: '10px', fontSize: '0.85rem', color: '#888' }}>
            {day}
          </div>
        ))}
        {days}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .calendar-day {
          height: 100px;
          border: 1px solid #eee;
          padding: 10px;
          position: relative;
          background: white;
          transition: background 0.2s;
        }
        .calendar-day:hover:not(.empty) {
          background: #f8f9fa;
          cursor: pointer;
        }
        .calendar-day.today {
          background: #e1f0ff;
          border-color: #00a8e8;
        }
        .day-number {
          font-weight: 600;
          font-size: 0.9rem;
        }
        .event-dot {
          width: 8px;
          height: 8px;
          background: #00a8e8;
          border-radius: 50%;
          position: absolute;
          bottom: 10px;
          right: 10px;
        }
        @media screen and (max-width: 600px) {
          .calendar-day {
            height: 60px;
            padding: 5px;
          }
        }
      `}} />
    </div>
  );
};

export default Calendar;
