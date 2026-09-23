import {
  getAllIncompleteTasks,
  getAllUsers,
  updateTask,
  createNotification,
  getClients,
  getProjects,
} from './database.js';
import { sendUrgentWorkEmail, isEmailConfigured } from './emailService.js';

let schedulerInterval = null;
let isScanRunning = false;
let lastScanTime = null;
let scanStats = {
  totalScans: 0,
  lastAlertCount: 0,
  totalAlertsDispatched: 0,
};

/**
 * Parse task due date and optional due time into a valid Date object.
 * Defaults to 18:00 (6:00 PM close of business) if no time specified.
 */
export function getTaskDeadlineDate(dueDateStr, dueTimeStr) {
  if (!dueDateStr || typeof dueDateStr !== 'string') return null;

  const parts = dueDateStr.trim().split('-');
  if (parts.length !== 3) return null;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  let hours = 18;
  let minutes = 0;

  if (dueTimeStr && typeof dueTimeStr === 'string' && dueTimeStr.includes(':')) {
    const timeParts = dueTimeStr.trim().split(':');
    const h = parseInt(timeParts[0], 10);
    const m = parseInt(timeParts[1], 10);
    if (!isNaN(h) && h >= 0 && h <= 23) hours = h;
    if (!isNaN(m) && m >= 0 && m <= 59) minutes = m;
  }

  return new Date(year, month, day, hours, minutes, 0, 0);
}

/**
 * Scan all incomplete tasks across all workspace accounts and dispatch multi-stage alerts.
 * Stages:
 *  1. '24h' - Due tomorrow (between 14h and 26h before deadline)
 *  2. 'imminent' - Final 1h or 2h warning (within user-configured hours, default <= 2h)
 *  3. 'overdue' - Past deadline (< 0h and >= -48h)
 */
export async function scanAndDispatchDeadlines() {
  if (isScanRunning) {
    console.log('⏳ [SCHEDULER] Scan already in progress, skipping overlapping tick.');
    return { skipped: true, reason: 'Scan in progress' };
  }

  isScanRunning = true;
  lastScanTime = new Date().toISOString();
  scanStats.totalScans++;

  const results = {
    scannedTasks: 0,
    dispatchedAlerts: [],
    skipped: 0,
  };

  try {
    const tasks = await getAllIncompleteTasks();
    results.scannedTasks = tasks.length;

    if (!tasks || tasks.length === 0) {
      isScanRunning = false;
      return results;
    }

    const users = await getAllUsers();
    const userMap = new Map();
    users.forEach(u => {
      if (u.id) userMap.set(u.id, u);
      if (u.email) userMap.set(u.email.toLowerCase(), u);
    });

    // Default user fallback
    const defaultUser = users[0] || {
      id: 'usr-1',
      name: 'Freelancer',
      email: process.env.SMTP_USER || 'alex.rivera@gmail.com',
      notificationSettings: { email: true, emailDayBefore: true, emailHoursBefore: 2, emailOverdue: true },
    };

    // Client and Project caching for names
    const allClients = await getClients();
    const clientMap = new Map((allClients || []).map(c => [c.id, c.name]));
    const allProjects = await getProjects();
    const projectMap = new Map((allProjects || []).map(p => [p.id, p.title]));

    const now = new Date();

    for (const task of tasks) {
      if (!task.dueDate) continue;

      const targetDeadline = getTaskDeadlineDate(task.dueDate, task.dueTime);
      if (!targetDeadline) continue;

      const diffMs = targetDeadline.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      const user = userMap.get(task.userId) || defaultUser;
      const notifSettings = user.notificationSettings || {};

      const isEmailAlertsEnabled = notifSettings.email !== false;
      const isDayBeforeEnabled = notifSettings.emailDayBefore !== false;
      const hoursBeforeThreshold = Math.max(1, Number(notifSettings.emailHoursBefore) || 2);
      const isOverdueEnabled = notifSettings.emailOverdue !== false;

      const targetEmail = (user.email || '').trim().toLowerCase();
      const clientName = clientMap.get(task.clientId) || 'Client';
      const projectName = projectMap.get(task.projectId) || 'Project';

      const enrichedTask = {
        ...task,
        clientName,
        projectName,
      };

      const sentStages = new Set(Array.isArray(task.reminderStagesSent) ? task.reminderStagesSent : []);
      let stageToDispatch = null;
      let hoursRemainingForTemplate = undefined;

      // STAGE 1: Due Tomorrow / 24 Hours in advance
      if (
        isDayBeforeEnabled &&
        diffHours > hoursBeforeThreshold &&
        diffHours <= 26 &&
        diffHours >= 14 &&
        !sentStages.has('24h')
      ) {
        stageToDispatch = '24h';
        hoursRemainingForTemplate = 24;
      }
      // STAGE 2: Imminent Final Warning (<= hoursBeforeThreshold, e.g. 1h or 2h)
      else if (
        diffHours > 0 &&
        diffHours <= hoursBeforeThreshold &&
        !sentStages.has('imminent')
      ) {
        stageToDispatch = 'imminent';
        hoursRemainingForTemplate = Math.max(1, Math.round(diffHours));
      }
      // STAGE 3: Overdue Notice (Past deadline, within 48h)
      else if (
        isOverdueEnabled &&
        diffHours < 0 &&
        diffHours >= -48 &&
        !sentStages.has('overdue')
      ) {
        stageToDispatch = 'overdue';
      }

      if (stageToDispatch) {
        console.log(
          `🔔 [SCHEDULER] Triggering [${stageToDispatch}] alert for task "${task.title}" (diff: ${diffHours.toFixed(
            1
          )}h) -> Target: ${targetEmail}`
        );

        // 1. Send Real Email if SMTP and user email preferences permit
        let emailSent = false;
        if (isEmailAlertsEnabled && targetEmail) {
          try {
            const emailRes = await sendUrgentWorkEmail({
              toEmail: targetEmail,
              userName: user.name || 'Freelancer',
              alertType: `deadline_${stageToDispatch}`,
              reminderStage: stageToDispatch,
              hoursRemaining: hoursRemainingForTemplate,
              task: enrichedTask,
            });
            emailSent = Boolean(emailRes?.success);
          } catch (err) {
            console.error(`❌ [SCHEDULER] Failed to deliver email for task ${task.id}:`, err.message);
          }
        }

        // 2. Create In-App Notification so user sees banner & chime upon visiting
        try {
          const dueDisplay = `${task.dueDate}${task.dueTime ? ` at ${task.dueTime}` : ''}`;
          let notifTitle = '⏰ Approaching Task Deadline';
          let notifMessage = `Deliverable "${task.title}" requires attention. Due: ${dueDisplay}`;
          let notifPriority = 'high';

          if (stageToDispatch === '24h') {
            notifTitle = '📅 Deadline Tomorrow!';
            notifMessage = `Deliverable "${task.title}" is due tomorrow (${dueDisplay}). Finish review today to stay on schedule.`;
            notifPriority = 'high';
          } else if (stageToDispatch === 'imminent') {
            const hText = hoursRemainingForTemplate ? `${hoursRemainingForTemplate}h` : '1-2h';
            notifTitle = `🚨 Final Warning: Due in ${hText}!`;
            notifMessage = `Deliverable "${task.title}" is due in approximately ${hText} (${dueDisplay}). Finalize now!`;
            notifPriority = 'urgent';
          } else if (stageToDispatch === 'overdue') {
            notifTitle = '⚠️ Overdue Deliverable Notice';
            notifMessage = `Deadline for "${task.title}" was ${dueDisplay} and is now overdue. Please submit or communicate extension.`;
            notifPriority = 'urgent';
          }

          await createNotification({
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            userId: task.userId || user.id,
            title: notifTitle,
            message: notifMessage,
            type: 'deadline',
            priority: notifPriority,
            relatedId: task.id,
            relatedType: 'task',
            timestamp: new Date().toISOString(),
            read: false,
          });
        } catch (notifErr) {
          console.warn(`[SCHEDULER] Could not create in-app notification:`, notifErr.message);
        }

        // 3. Persist Sent Stage in Task to ensure zero duplicate spam
        sentStages.add(stageToDispatch);
        const updatedStages = Array.from(sentStages);
        await updateTask(task.id, { reminderStagesSent: updatedStages });

        results.dispatchedAlerts.push({
          taskId: task.id,
          taskTitle: task.title,
          stage: stageToDispatch,
          targetEmail,
          emailSent,
          dueDisplay: `${task.dueDate}${task.dueTime ? ` at ${task.dueTime}` : ''}`,
        });

        scanStats.totalAlertsDispatched++;
      } else {
        results.skipped++;
      }
    }

    scanStats.lastAlertCount = results.dispatchedAlerts.length;
    if (results.dispatchedAlerts.length > 0) {
      console.log(
        `✅ [SCHEDULER] Successfully dispatched ${results.dispatchedAlerts.length} deadline alerts.`
      );
    }
  } catch (err) {
    console.error('❌ [SCHEDULER] Error during scan cycle:', err);
  } finally {
    isScanRunning = false;
  }

  return results;
}

/**
 * Start the background deadline monitor interval (default runs every 5 minutes)
 */
export function startDeadlineScheduler(intervalMs = 5 * 60 * 1000) {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }

  console.log(`⏰ [SCHEDULER] Starting automated deadline background scanner (interval: ${intervalMs / 1000}s)`);

  // Run initial scan after 5 seconds of server startup
  setTimeout(() => {
    scanAndDispatchDeadlines().catch(e => console.error('Initial deadline scan error:', e));
  }, 5000);

  // Set recurring scan
  schedulerInterval = setInterval(() => {
    scanAndDispatchDeadlines().catch(e => console.error('Recurring deadline scan error:', e));
  }, intervalMs);

  return schedulerInterval;
}

/**
 * Stop scheduler
 */
export function stopDeadlineScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('🛑 [SCHEDULER] Background deadline scanner stopped.');
  }
}

/**
 * Get current scheduler status and statistics
 */
export function getSchedulerStatus() {
  return {
    isRunning: Boolean(schedulerInterval),
    lastScanTime,
    stats: scanStats,
    smtpConfigured: isEmailConfigured(),
  };
}
