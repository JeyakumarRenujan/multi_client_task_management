import { useEffect, useRef, useState, useCallback } from 'react';
import { Task, UserProfile } from '../types';
import { api } from '../services/api';

export function parseTaskDeadline(dueDate?: string, dueTime?: string): Date | null {
  if (!dueDate || typeof dueDate !== 'string') return null;
  const parts = dueDate.trim().split('-');
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;

  let hours = 18;
  let mins = 0;
  if (dueTime && dueTime.includes(':')) {
    const timeParts = dueTime.trim().split(':');
    const h = parseInt(timeParts[0], 10);
    const min = parseInt(timeParts[1], 10);
    if (!isNaN(h) && h >= 0 && h <= 23) hours = h;
    if (!isNaN(min) && min >= 0 && min <= 59) mins = min;
  }
  return new Date(y, m, d, hours, mins, 0, 0);
}

interface UseDeadlineSchedulerProps {
  user: UserProfile | null;
  tasks: Task[];
  onDispatchAlert: (task: Task, stage: '24h' | 'imminent' | 'overdue', hoursLeft?: number) => Promise<any> | void;
  onUpdateTaskSentStages: (taskId: string, stages: string[]) => void;
}

export function useDeadlineScheduler({
  user,
  tasks,
  onDispatchAlert,
  onUpdateTaskSentStages,
}: UseDeadlineSchedulerProps) {
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isEvaluatingRef = useRef(false);

  const evaluateDeadlines = useCallback(async () => {
    if (!user || isEvaluatingRef.current) return;
    isEvaluatingRef.current = true;
    setIsScanning(true);

    try {
      const now = new Date();
      const notifSettings = user.notificationSettings || {};
      const isDayBeforeEnabled = notifSettings.emailDayBefore !== false;
      const hoursBeforeThreshold = Math.max(1, Number(notifSettings.emailHoursBefore) || 2);
      const isOverdueEnabled = notifSettings.emailOverdue !== false;

      for (const task of tasks) {
        if (task.status === 'done' || !task.dueDate) continue;

        const targetDeadline = parseTaskDeadline(task.dueDate, task.dueTime);
        if (!targetDeadline) continue;

        const diffMs = targetDeadline.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        const sentStages = new Set(Array.isArray(task.reminderStagesSent) ? task.reminderStagesSent : []);
        let stageToTrigger: '24h' | 'imminent' | 'overdue' | null = null;
        let hoursLeft: number | undefined = undefined;

        // Stage 1: Tomorrow / 24h Before (between 14h and 26h before deadline)
        if (
          isDayBeforeEnabled &&
          diffHours > hoursBeforeThreshold &&
          diffHours <= 26 &&
          diffHours >= 14 &&
          !sentStages.has('24h')
        ) {
          stageToTrigger = '24h';
          hoursLeft = 24;
        }
        // Stage 2: Final Warning (<= hoursBeforeThreshold, e.g. 1h or 2h)
        else if (
          diffHours > 0 &&
          diffHours <= hoursBeforeThreshold &&
          !sentStages.has('imminent')
        ) {
          stageToTrigger = 'imminent';
          hoursLeft = Math.max(1, Math.round(diffHours));
        }
        // Stage 3: Overdue Notice (past deadline within 48h)
        else if (
          isOverdueEnabled &&
          diffHours < 0 &&
          diffHours >= -48 &&
          !sentStages.has('overdue')
        ) {
          stageToTrigger = 'overdue';
        }

        if (stageToTrigger) {
          console.log(`[CLIENT SCHEDULER] Dispatching [${stageToTrigger}] alert for task: ${task.title}`);
          sentStages.add(stageToTrigger);
          const nextStages = Array.from(sentStages);
          onUpdateTaskSentStages(task.id, nextStages);
          await onDispatchAlert(task, stageToTrigger, hoursLeft);
        }
      }

      setLastCheckTime(new Date());

      // Trigger backend scan to ensure synchronization
      api.checkDeadlines().catch(() => {});
    } catch (err) {
      console.warn('[CLIENT SCHEDULER] Error during scan evaluation:', err);
    } finally {
      isEvaluatingRef.current = false;
      setIsScanning(false);
    }
  }, [user, tasks, onDispatchAlert, onUpdateTaskSentStages]);

  useEffect(() => {
    if (!user) return;

    // Run first evaluation after 3 seconds of mount
    const timeoutId = setTimeout(() => {
      evaluateDeadlines();
    }, 3000);

    // Run evaluation every 60 seconds
    intervalRef.current = setInterval(() => {
      evaluateDeadlines();
    }, 60 * 1000);

    return () => {
      clearTimeout(timeoutId);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user, evaluateDeadlines]);

  return {
    lastCheckTime,
    isScanning,
    scanNow: evaluateDeadlines,
  };
}
