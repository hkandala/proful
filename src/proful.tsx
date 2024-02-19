import { useEffect, useState } from "react";
import { MenuBarExtra, getFrontmostApplication } from "@raycast/api";
import { Session, getCurrentSession, getTodaySessions, isProfulVisible } from "./util";

export default function Command() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<Session>();
  const [todaySessions, setTodaySessions] = useState<Session[]>([]);

  const loadState = async () => {
    setIsLoading(true);

    const frontmostApplication = await getFrontmostApplication();
    if (frontmostApplication.name === "loginwindow") {
      return;
    }

    setActiveSession(await getCurrentSession());
    setTodaySessions((await getTodaySessions()).reverse().slice(1));

    setIsLoading(false);
  };

  const getSessionTitle = (session?: Session) => {
    if (!session) {
      return "";
    }

    let title = "";
    if (session.mode === "procrastinate") {
      title = (session.end ? "procrastinated: " : "procrastinating: ") + session.title;
    } else if (session.mode === "focus") {
      title = (session.end ? "focused: " : "focusing: ") + session.title;
    } else if (session.mode === "chill") {
      title = (session.end ? "chilled: " : "chilling: ") + session.title;
    }

    title += " (" + getTimeString((session.end ? session.end : Date.now()) - session.start) + ")";

    return title;
  };

  const getTimeString = (ms: number) => {
    let timeString;
    const mins = Math.floor(ms / 1000 / 60);
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins - hours * 60;
      timeString = hours + "h " + remainingMins + "m";
    } else {
      timeString = mins + "m";
    }
    return timeString;
  };

  const getTodaySessionTitle = (session: Session, alternate: boolean) => {
    return alternate ? " " + getSessionTitle(session) + "\n" : " " + getSessionTitle(session);
  };

  const getTodaySessionSubtitle = (session: Session) => {
    if (!session.end) {
      return;
    }
    const startTime = new Date(session.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const endTime = new Date(session.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return startTime + " - " + endTime;
  };

  const getSessionKey = (session: Session) => {
    return session.start;
  };

  const getTotalTime = (mode: Session["mode"]) => {
    const sessions = activeSession ? todaySessions.concat([activeSession]) : todaySessions;
    let totalMs = 0;
    for (const session of sessions) {
      const ms = (session.end ? session.end : Date.now()) - session.start;
      if (session.mode === mode) {
        totalMs += ms;
      }
    }
    return getTimeString(totalMs);
  };

  useEffect(() => {
    loadState();
  }, []);

  return (
    isProfulVisible() && (
      <MenuBarExtra title={getSessionTitle(activeSession)} isLoading={isLoading}>
        {todaySessions.length !== 0 && (
          <MenuBarExtra.Section title=" earlier today">
            {todaySessions.map((session) => (
              <MenuBarExtra.Item
                key={getSessionKey(session)}
                title={getTodaySessionTitle(session, false)}
                onAction={() => {}}
                alternate={
                  <MenuBarExtra.Item
                    key={getSessionKey(session) + "alt"}
                    title={getTodaySessionTitle(session, true)}
                    subtitle={getTodaySessionSubtitle(session)}
                    onAction={() => {}}
                  />
                }
              />
            ))}
          </MenuBarExtra.Section>
        )}
        <MenuBarExtra.Section title=" overall today">
          <MenuBarExtra.Item
            title={" procrastinated: " + getTotalTime("procrastinate")}
            onAction={() => {}}
          ></MenuBarExtra.Item>
          <MenuBarExtra.Item title={" focused: " + getTotalTime("focus")} onAction={() => {}}></MenuBarExtra.Item>
          <MenuBarExtra.Item title={" chilled: " + getTotalTime("chill")} onAction={() => {}}></MenuBarExtra.Item>
        </MenuBarExtra.Section>
      </MenuBarExtra>
    )
  );
}
