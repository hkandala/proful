import { Cache, LocalStorage } from "@raycast/api";

const cache = new Cache();

export type Session = {
  title: string;
  mode: "procrastinate" | "focus" | "chill";
  start: number;
  end: number | null;
  lastPing: number;
};

const SESSION_TIMEOUT_MS = 1000 * 60 * 5;

export function isProfulVisible(): boolean {
  return !cache.has("hide");
}

export function toggleProfulVisibility() {
  cache.has("hide") ? cache.remove("hide") : cache.set("hide", "true");
}

export async function startProcrastinationSession(title: string) {
  await addNewSession(title, "procrastinate");
}

export async function startFocusSession(title: string) {
  await addNewSession(title, "focus");
}

export async function startChillingSession(title: string) {
  await addNewSession(title, "chill");
}

export async function getCurrentSession(): Promise<Session> {
  const sessions = await getAllSessions();
  console.log(sessions);

  let currentSession = sessions[sessions.length - 1];
  if (currentSession.end != null) {
    // we should not have a session that has ended
    throw new Error("Something went wrong, no active session");
  }

  if (Date.now() - currentSession.lastPing > SESSION_TIMEOUT_MS) {
    // if the last ping is more than 5 minutes ago, we should end the current session
    // this is to handle the case where user locks the screen or turns off the computer
    currentSession.end = currentSession.lastPing;
    // restore the last session as current session
    const newCurrentSession = {
      title: currentSession.title,
      mode: currentSession.mode,
      start: Date.now(),
      end: null,
      lastPing: Date.now(),
    };
    sessions.push(newCurrentSession);
    currentSession = newCurrentSession;
  } else {
    // if the last ping is less than 5 minutes ago, we should update the lastPing
    currentSession.lastPing = Date.now();
  }

  await setAllSessions(sessions);

  return currentSession;
}

export async function getTodaySessions(): Promise<Session[]> {
  const sessions = await getAllSessions();
  const today = new Date().toDateString();
  return sessions.filter((session) => new Date(session.start).toDateString() === today);
}

async function addNewSession(title: string, mode: Session["mode"]): Promise<void> {
  const sessions = await getAllSessions();
  const currentSession = sessions[sessions.length - 1];
  if (currentSession.end == null) {
    currentSession.end =
      Date.now() - currentSession.lastPing > SESSION_TIMEOUT_MS ? currentSession.lastPing : Date.now();
  }
  sessions.push({ title, mode, start: Date.now(), end: null, lastPing: Date.now() });
  await setAllSessions(sessions);
}

async function getAllSessions(): Promise<Session[]> {
  const sessions = await LocalStorage.getItem<string>("sessions");
  if (sessions == undefined) {
    await clearAllSessions();
  }
  return JSON.parse(String(await LocalStorage.getItem<string>("sessions"))) as Session[];
}

async function setAllSessions(sessions: Session[]): Promise<void> {
  await LocalStorage.setItem("sessions", JSON.stringify(sessions));
}

async function clearAllSessions(): Promise<void> {
  await LocalStorage.setItem(
    "sessions",
    JSON.stringify([{ title: "welcome to proful", mode: "focus", start: Date.now(), end: null }]),
  );
}
