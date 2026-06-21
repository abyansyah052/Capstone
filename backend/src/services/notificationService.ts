import dotenv from "dotenv";

dotenv.config();

interface NotificationPayload {
  patientName: string;
  date: string;
  time: string;
  channel: "none" | "whatsapp" | "email" | "both";
  phone?: string;
  email?: string;
}

// ICS Calendar file generator mock
const generateCalendarIcs = (summary: string, dateStr: string, timeStr: string): string => {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);

  if (!year || !month || !day || hour === undefined || minute === undefined) {
    return "INVALID_DATE";
  }

  // Format date-time for ICS: YYYYMMDDTHHMMSSZ (UTC or simple local representation)
  const dtStart = `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}${String(minute).padStart(2, "0")}00`;
  const dtEnd = `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}T${String(hour + 1).padStart(2, "0")}${String(minute).padStart(2, "0")}00`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Asisya Consulting//IPMS//ID",
    "BEGIN:VEVENT",
    `SUMMARY:${summary}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    "DESCRIPTION:Sesi konsultasi psikologi terjadwal di Asisya Consulting",
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
};

// Send notification simulation
export const sendNotification = async (payload: NotificationPayload): Promise<boolean> => {
  const { patientName, date, time, channel, phone, email } = payload;
  const summary = `Janji Temu Konsultasi: ${patientName}`;
  const icsContent = generateCalendarIcs(summary, date, time);

  console.log(
    `[notification] Triggering notifications for appointment: ${patientName} (${date} at ${time})`
  );

  if (channel === "whatsapp" || channel === "both") {
    const waUrl = process.env.WHATSAPP_API_URL || "https://api.whatsapp.example/send";
    const waToken = process.env.WHATSAPP_API_TOKEN;
    const msg = `Halo ${patientName}, Anda memiliki jadwal konsultasi psikologi di Asisya Consulting pada ${date} pukul ${time}. Harap hadir tepat waktu. Terima kasih.`;

    console.log(`[whatsapp] Mocking dispatch to ${phone || "no-phone-given"}`);
    console.log(`[whatsapp] Endpoint URL: ${waUrl} (Token Configured: ${!!waToken})`);
    console.log(`[whatsapp] Message content: "${msg}"`);
  }

  if (channel === "email" || channel === "both") {
    const smtpHost = process.env.EMAIL_SMTP_HOST || "smtp.example.com";
    const smtpPort = process.env.EMAIL_SMTP_PORT || "587";
    const smtpUser = process.env.EMAIL_SMTP_USER;

    console.log(`[email] Mocking SMTP calendar dispatch to ${email || "no-email-given"}`);
    console.log(`[email] Configuration: Host=${smtpHost}, Port=${smtpPort}, User=${smtpUser}`);
    console.log(`[email] Attached Calendar .ics Attachment: \n${icsContent}\n`);
  }

  return true;
};
