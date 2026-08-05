import type nodemailer from 'nodemailer';

type MailQueueItem = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attempts?: number;
};

let transporter: nodemailer.Transporter | null = null;
const queue: MailQueueItem[] = [];
let workerStarted = false;

export function initMailer(trans: nodemailer.Transporter | null) {
  transporter = trans;
  if (!workerStarted) {
    workerStarted = true;
    setInterval(processQueue, 3000);
  }
}

export function queueEmail(to: string, subject: string, html?: string, text?: string) {
  if (!to) return;
  queue.push({ to, subject, html, text, attempts: 0 });
}

async function processQueue() {
  if (queue.length === 0) return;
  const item = queue.shift()!;
  if (!transporter) {
    console.warn('No mail transporter configured; dropping email to', item.to);
    return;
  }

  try {
    await transporter.sendMail({ to: item.to, subject: item.subject, text: item.text, html: item.html });
    console.log('Email sent to', item.to, item.subject);
  } catch (err) {
    console.error('Failed to send email to', item.to, err);
    item.attempts = (item.attempts || 0) + 1;
    if ((item.attempts || 0) < 3) {
      // retry after a short delay
      setTimeout(() => queue.push(item), 3000);
    } else {
      console.error('Dropping email after 3 attempts to', item.to);
    }
  }
}
