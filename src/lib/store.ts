
import { useSyncExternalStore } from "react";

export type QueueStatus =
  | "waiting"
  | "in_consultation"
  | "completed"
  | "cancelled";

export type ApptStatus =
  | "booked"
  | "confirmed"
  | "completed"
  | "cancelled";

export type SosStatus = "pending" | "acknowledged" | "resolved";

export interface QueueEntry {
  id: string;
  token: number;
  patientId: string;
  arrivedAt: string;
  status: QueueStatus;
}

export interface Appointment {
  id: string;
  patientId: string;
  date: string;
  time: string;
  department: string;
  reason: string;
  status: ApptStatus;
  createdAt: string;
}

export interface SosAlert {
  id: string;
  patientId: string;
  createdAt: string;
  status: SosStatus;
  note: string;
  acknowledgedAt?: string;
}

export interface Activity {
  id: string;
  at: string;
  text: string;
}

export interface AppState {
  version: 1;
  queue: QueueEntry[];
  appointments: Appointment[];
  sos: SosAlert[];
  activity: Activity[];
  nextToken: number;
}

export const STUDENT_ID = "STU-1024";

export const DEPARTMENTS = [
  "General Medicine",
  "Dental",
  "Physiotherapy",
  "Counselling",
  "Eye Care",
];

export const AVG_CONSULT_MIN = 8;

const KEY = "medqueue:v1";

const uid = () => Math.random().toString(36).slice(2, 10);

const minsAgo = (m: number) =>
  new Date(Date.now() - m * 60000).toISOString();

const today = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function seedState(): AppState {
  return {
    version: 1,
    nextToken: 106,
    queue: [
      {
        id: uid(),
        token: 101,
        patientId: "STU-0871",
        arrivedAt: minsAgo(52),
        status: "completed",
      },
      {
        id: uid(),
        token: 102,
        patientId: "STU-0915",
        arrivedAt: minsAgo(40),
        status: "in_consultation",
      },
      {
        id: uid(),
        token: 103,
        patientId: "STU-0433",
        arrivedAt: minsAgo(31),
        status: "waiting",
      },
      {
        id: uid(),
        token: 104,
        patientId: "STU-1190",
        arrivedAt: minsAgo(22),
        status: "waiting",
      },
      {
        id: uid(),
        token: 105,
        patientId: "STU-0657",
        arrivedAt: minsAgo(12),
        status: "waiting",
      },
    ],
    appointments: [
      {
        id: uid(),
        patientId: "STU-0433",
        date: today(),
        time: "14:30",
        department: "Dental",
        reason: "Check-up",
        status: "confirmed",
        createdAt: minsAgo(600),
      },
      {
        id: uid(),
        patientId: "STU-0871",
        date: today(),
        time: "16:00",
        department: "Counselling",
        reason: "Follow-up",
        status: "booked",
        createdAt: minsAgo(300),
      },
    ],
    sos: [],
    activity: [],
  };
}

function isValid(x: unknown): x is AppState {
  const s = x as AppState;

  return (
    !!s &&
    s.version === 1 &&
    Array.isArray(s.queue) &&
    Array.isArray(s.appointments) &&
    Array.isArray(s.sos) &&
    Array.isArray(s.activity) &&
    typeof s.nextToken === "number"
  );
}

let state: AppState | null = null;
const listeners = new Set<() => void>();

function load(): AppState {
  if (typeof window === "undefined") {
    return seedState();
  }

  try {
    const raw = window.localStorage.getItem(KEY);

    if (raw) {
      const parsed: unknown = JSON.parse(raw);

      if (isValid(parsed)) {
        return parsed;
      }
    }
  } catch {
    // Invalid stored data falls through to the demo seed.
  }

  const s = seedState();
  persist(s);
  return s;
}

function persist(s: AppState) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Storage may be full or unavailable.
  }
}

const serverSnapshot: AppState = {
  version: 1,
  queue: [],
  appointments: [],
  sos: [],
  activity: [],
  nextToken: 100,
};

export function getState(): AppState {
  if (!state) state = load();
  return state;
}

export function setState(fn: (s: AppState) => AppState) {
  state = fn(getState());
  persist(state);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY || event.key === null) {
      state = load();
      listeners.forEach((item) => item());
    }
  };

  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useStore<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(getState()),
    () => selector(serverSnapshot),
  );
}

const log = (s: AppState, text: string): Activity[] => [
  {
    id: uid(),
    at: new Date().toISOString(),
    text,
  },
  ...s.activity,
].slice(0, 20);

// ---------- Selectors ----------

export function activeToken(s: AppState, pid = STUDENT_ID) {
  return s.queue.find(
    (q) =>
      q.patientId === pid &&
      (q.status === "waiting" || q.status === "in_consultation"),
  );
}

export function queuePosition(s: AppState, entry: QueueEntry) {
  if (entry.status !== "waiting") return 0;

  return (
    s.queue.filter(
      (q) => q.status === "waiting" && q.token < entry.token,
    ).length + 1
  );
}

export function estimatedWait(s: AppState, entry: QueueEntry) {
  if (entry.status !== "waiting") return 0;

  const inConsult = s.queue.some(
    (q) => q.status === "in_consultation",
  )
    ? 1
    : 0;

  return (
    queuePosition(s, entry) - 1 + inConsult
  ) * AVG_CONSULT_MIN;
}

// ---------- Queue actions ----------

export function generateToken(
  pid = STUDENT_ID,
): { ok: boolean; error?: string } {
  const s = getState();

  if (activeToken(s, pid)) {
    return {
      ok: false,
      error: "You already have an active token.",
    };
  }

  setState((current) => {
    const token = current.nextToken;

    return {
      ...current,
      nextToken: token + 1,
      queue: [
        ...current.queue,
        {
          id: uid(),
          token,
          patientId: pid,
          arrivedAt: new Date().toISOString(),
          status: "waiting",
        },
      ],
      activity:
        pid === STUDENT_ID
          ? log(current, `Generated token #${token}`)
          : current.activity,
    };
  });

  return { ok: true };
}

export function setQueueStatus(id: string, status: QueueStatus) {
  setState((s) => {
    const entry = s.queue.find((q) => q.id === id);

    return {
      ...s,
      queue: s.queue.map((q) =>
        q.id === id ? { ...q, status } : q,
      ),
      activity:
        entry?.patientId === STUDENT_ID
          ? log(s, `Token #${entry.token} is now ${label(status)}`)
          : s.activity,
    };
  });
}

// ---------- Appointment validation and actions ----------

export type ApptErrors = {
  department?: string;
  date?: string;
  time?: string;
};


function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parts = value.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  if (!year || !month || !day) {
    return false;
  }

  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}



export function validateAppointment(a: {
  date: string;
  time: string;
  department: string;
}): ApptErrors {
  const errors: ApptErrors = {};

  if (!DEPARTMENTS.includes(a.department)) {
    errors.department = "Choose a department.";
  }

  if (!isRealDate(a.date)) {
    errors.date = "Choose a valid date.";
  } else if (a.date < today()) {
    errors.date = "Date cannot be in the past.";
  }

  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(a.time)) {
    errors.time = "Choose a valid time.";
  } else if (a.time < "09:00" || a.time > "17:00") {
    errors.time = "Please choose a time within clinic hours.";
  } else if (a.time >= "13:00" && a.time < "14:00") {
    errors.time = "Please choose another appointment time.";
  } else if (
    isRealDate(a.date) &&
    a.date === today() &&
    new Date(`${a.date}T${a.time}:00`).getTime() <
      Date.now() + 15 * 60 * 1000
  ) {
    errors.time = "Please choose a time at least 15 minutes from now.";
  }

  return errors;
}


export function bookAppointment(
  a: {
    date: string;
    time: string;
    department: string;
    reason: string;
  },
  pid = STUDENT_ID,
): { ok: boolean; errors: ApptErrors } {
  const errors = validateAppointment(a);

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const s = getState();

 
  const duplicate = s.appointments.some(
    (appointment) =>
      appointment.department === a.department &&
      appointment.date === a.date &&
      appointment.time === a.time &&
      appointment.status !== "cancelled",
  );


  if (duplicate) {
    return {
      ok: false,
      errors: {
        time: "This appointment slot is already booked. Please choose another time.",
      },
    };
  }

  setState((current) => ({
    ...current,
    appointments: [
      ...current.appointments,
      {
        id: uid(),
        patientId: pid,
        ...a,
        reason: a.reason.trim().slice(0, 200),
        status: "booked",
        createdAt: new Date().toISOString(),
      },
    ],
    activity: log(
      current,
      `Booked ${a.department} on ${a.date} at ${a.time}`,
    ),
  }));

  return { ok: true, errors: {} };
}

export function setApptStatus(id: string, status: ApptStatus) {
  setState((s) => {
    const appointment = s.appointments.find((a) => a.id === id);

    return {
      ...s,
      appointments: s.appointments.map((a) =>
        a.id === id ? { ...a, status } : a,
      ),
      activity: appointment?.patientId === STUDENT_ID
        ? log(
            s,
            `${appointment.department} appointment ${label(status)}`,
          )
        : s.activity,
    };
  });
}

// ---------- SOS actions ----------

export function raiseSos(note: string, pid = STUDENT_ID) {
  const s = getState();

  if (s.sos.some((alert) => alert.patientId === pid && alert.status === "pending")) {
    return {
      ok: false,
      error: "An SOS request is already pending.",
    };
  }

  setState((current) => ({
    ...current,
    sos: [
      {
        id: uid(),
        patientId: pid,
        createdAt: new Date().toISOString(),
        status: "pending",
        note: note.trim().slice(0, 200),
      },
      ...current.sos,
    ],
    activity: log(current, "Sent an emergency SOS request"),
  }));

  return { ok: true };
}

export function setSosStatus(id: string, status: SosStatus) {
  setState((s) => ({
    ...s,
    sos: s.sos.map((alert) =>
      alert.id === id
        ? {
            ...alert,
            status,
            acknowledgedAt:
              alert.acknowledgedAt ?? new Date().toISOString(),
          }
        : alert,
    ),
    activity: s.sos.find((alert) => alert.id === id)?.patientId === STUDENT_ID
      ? log(s, `SOS request ${label(status)} by staff`)
      : s.activity,
  }));
}

// ---------- Utilities ----------

export function resetDemo() {
  setState(() => seedState());
}

export function label(value: string) {
  return value.replace("_", " ");
}

export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
