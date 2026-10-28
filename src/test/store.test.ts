import { beforeEach, describe, expect, it } from "vitest";
import { STUDENT_ID, activeToken, bookAppointment, generateToken, getState, raiseSos, resetDemo, setQueueStatus, setSosStatus } from "@/lib/store";

beforeEach(() => { localStorage.clear(); resetDemo(); });

describe("store rules", () => {
  it("allows only one active token per student", () => {
    expect(generateToken().ok).toBe(true);
    expect(generateToken().ok).toBe(false);
    const t = activeToken(getState())!;
    setQueueStatus(t.id, "completed");
    expect(generateToken().ok).toBe(true);
  });
  it("rejects past dates and out-of-hours times", () => {
    expect(bookAppointment({ department: "Dental", date: "2000-01-01", time: "10:00", reason: "" }).errors.date).toBeTruthy();
    const d = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    expect(bookAppointment({ department: "Dental", date: d, time: "20:00", reason: "" }).errors.time).toBeTruthy();
    expect(bookAppointment({ department: "Dental", date: d, time: "10:00", reason: "" }).ok).toBe(true);
  });
  it("acknowledging SOS updates the stored record", () => {
    raiseSos("help");
    const id = getState().sos[0]!.id;
    setSosStatus(id, "acknowledged");
    const saved = JSON.parse(localStorage.getItem("medqueue:v1")!);
    expect(saved.sos[0].status).toBe("acknowledged");
    expect(saved.sos[0].patientId).toBe(STUDENT_ID);
  });
  it("recovers from corrupted storage", () => {
    localStorage.setItem("medqueue:v1", "{bad");
    expect(() => getState()).not.toThrow();
  });
});
