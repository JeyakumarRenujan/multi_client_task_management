import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Task } from '../../types';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Calendar as CalendarIcon,
  Plus,
} from 'lucide-react';

interface TaskCalendarProps {
  filteredTasks: Task[];
  onEditTask: (task: Task) => void;
}

export const TaskCalendar: React.FC<TaskCalendarProps> = ({
  filteredTasks,
  onEditTask,
}) => {
  const { clients, setIsTaskModalOpen, setSelectedTaskForEdit } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const today = new Date();

  // Helper: format a local Date to YYYY-MM-DD without UTC conversion
  const toLocalDateStr = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = toLocalDateStr(today);

  // Calendar cells
  const calendarCells: { day: number; isCurrentMonth: boolean; dateStr: string }[] = [];

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const dateStr = toLocalDateStr(new Date(year, month - 1, day));
    calendarCells.push({ day, isCurrentMonth: false, dateStr });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = toLocalDateStr(new Date(year, month, i));
    calendarCells.push({ day: i, isCurrentMonth: true, dateStr });
  }

  // Next month leading days to complete grid
  const remainingCells = 35 - calendarCells.length;
  if (remainingCells > 0) {
    for (let i = 1; i <= remainingCells; i++) {
      const dateStr = toLocalDateStr(new Date(year, month + 1, i));
      calendarCells.push({ day: i, isCurrentMonth: false, dateStr });
    }
  }

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-primary-400/70 dark:border-slate-800/80 shadow-sm p-5 md:p-6 space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-700/20">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {monthNames[month]} {year}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Monthly Deliverable Schedule &amp; Deadlines
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 transition-colors"
          >
            Today
          </button>
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 py-1.5 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider">
        {daysOfWeek.map(d => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Grid of Days */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {calendarCells.map((cell, idx) => {
          const isToday = cell.dateStr === todayStr;
          const dayTasks = filteredTasks.filter(t => t.dueDate === cell.dateStr);

          return (
            <div
              key={idx}
              className={`min-h-[50px] sm:min-h-[105px] md:min-h-[120px] p-1 sm:p-2 rounded-xl sm:rounded-2xl border transition-all flex flex-col justify-between ${
                isToday
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500/60 dark:border-emerald-500/40 ring-1 ring-emerald-500/30'
                  : cell.isCurrentMonth
                  ? 'bg-white dark:bg-slate-900 border-slate-200/70 dark:border-slate-800/80 hover:border-emerald-300 dark:hover:border-emerald-700'
                  : 'bg-slate-50/40 dark:bg-slate-950/30 border-slate-100 dark:border-slate-900/60 opacity-40'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                <span
                  className={`text-xs sm:text-sm font-black w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center ${
                    isToday
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : cell.isCurrentMonth
                      ? 'text-slate-800 dark:text-slate-200'
                      : 'text-slate-400'
                  }`}
                >
                  {cell.day}
                </span>

                {dayTasks.length > 0 && (
                  <span className="text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {dayTasks.length}
                  </span>
                )}
              </div>

              {/* Mobile View (< sm): Colored dots indicator */}
              <div className="flex sm:hidden items-center justify-center gap-1 mt-1 flex-wrap">
                {dayTasks.slice(0, 3).map(task => (
                  <span
                    key={task.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditTask(task);
                    }}
                    className={`w-2 h-2 rounded-full cursor-pointer ${
                      task.status === 'done'
                        ? 'bg-emerald-500'
                        : task.priority === 'urgent'
                        ? 'bg-rose-500'
                        : 'bg-teal-500'
                    }`}
                    title={task.title}
                  />
                ))}
                {dayTasks.length > 3 && (
                  <span className="text-[9px] font-bold text-slate-400">
                    +{dayTasks.length - 3}
                  </span>
                )}
              </div>

              {/* Tablet/Desktop View (>= sm): Full task chip list */}
              <div className="hidden sm:block space-y-1 overflow-y-auto max-h-[85px]">
                {dayTasks.slice(0, 2).map(task => {
                  const client = clients.find(c => c.id === task.clientId);
                  const isDone = task.status === 'done';

                  return (
                    <div
                      key={task.id}
                      onClick={() => onEditTask(task)}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold truncate cursor-pointer transition-all flex items-center gap-1.5 ${
                        isDone
                          ? 'bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 line-through'
                          : task.priority === 'urgent'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-emerald-100 dark:hover:bg-emerald-950'
                      }`}
                      title={`${task.title} (${client?.company})`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: client?.color || '#10b981' }}
                      />
                      <span className="truncate">{task.title}</span>
                    </div>
                  );
                })}

                {dayTasks.length > 2 && (
                  <div className="text-[10px] sm:text-[11px] font-semibold text-slate-400 text-center">
                    +{dayTasks.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
