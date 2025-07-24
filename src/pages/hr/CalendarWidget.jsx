import React from 'react';

export default function CalendarWidget({
  calendarDate,
  setCalendarDate,
  today,
  calendarMatrix,
  monthNames,
  handlePrevMonth,
  handleNextMonth,
  year,
  month,
}) {
  return (
    <div className='calendar-mock calendar-horizontal'>
      <div className='calendar-title calendar-title-horizontal'>
        <button className='calendar-nav-btn' onClick={handlePrevMonth}>
          &lt;
        </button>
        <span className='calendar-month-label'>
          {monthNames[month]} {year}
        </span>
        <button className='calendar-nav-btn' onClick={handleNextMonth}>
          &gt;
        </button>
      </div>
      <table className='calendar-table-horizontal'>
        <thead>
          <tr>
            <th className='calendar-th-mo'>Mo</th>
            <th>Tu</th>
            <th>We</th>
            <th>Th</th>
            <th>Fr</th>
            <th className='calendar-th-sa'>Sa</th>
            <th className='calendar-th-su'>Su</th>
          </tr>
        </thead>
        <tbody>
          {calendarMatrix.map((row, i) => (
            <tr key={i}>
              {row.map((date, j) => {
                const isToday =
                  date &&
                  today.getFullYear() === year &&
                  today.getMonth() === month &&
                  today.getDate() === date;
                return (
                  <td
                    key={j}
                    className={
                      (isToday ? 'calendar-today ' : '') +
                      (j === 5 ? 'calendar-sa ' : '') +
                      (j === 6 ? 'calendar-su ' : '')
                    }
                  >
                    {date || ''}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
