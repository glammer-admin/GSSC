import { describe, it, expect } from "vitest";
import {
  getErrorByCode,
  isCriticalError,
  formatErrorLog,
  ERROR_CODES,
} from "../error-codes";

describe("getErrorByCode", () => {
  it("returns the correct error entry for a valid code", () => {
    const error = getErrorByCode("AUTH-NET-001");
    expect(error.code).toBe("AUTH-NET-001");
    expect(error.severity).toBe("critical");
  });

  it("returns generic error for unknown code", () => {
    const error = getErrorByCode("UNKNOWN-999");
    expect(error.code).toBe("ERR-GEN-000");
  });

  it("handles codes with underscores as well as dashes", () => {
    const error = getErrorByCode("REG-DUP-001");
    expect(error.code).toBe("REG-DUP-001");
    expect(error.severity).toBe("info");
  });
});

describe("isCriticalError", () => {
  it("returns true for critical errors", () => {
    expect(isCriticalError("AUTH-NET-001")).toBe(true);
    expect(isCriticalError("AUTH-CFG-001")).toBe(true);
  });

  it("returns false for non-critical errors", () => {
    expect(isCriticalError("SES-EXP-001")).toBe(false);
    expect(isCriticalError("NAV-NTF-001")).toBe(false);
  });
});

describe("formatErrorLog", () => {
  it("formats error log correctly", () => {
    expect(formatErrorLog("AUTH-NET-001", "Connection failed")).toBe(
      "[AUTH-NET-001] Connection failed"
    );
  });
});

describe("ERROR_CODES", () => {
  it("all entries have required fields", () => {
    for (const [key, entry] of Object.entries(ERROR_CODES)) {
      expect(entry.code, `${key} missing code`).toBeTruthy();
      expect(entry.description, `${key} missing description`).toBeTruthy();
      expect(entry.userMessage, `${key} missing userMessage`).toBeTruthy();
      expect(entry.severity, `${key} missing severity`).toBeTruthy();
      expect(entry.action, `${key} missing action`).toBeTruthy();
    }
  });

  it("no error reveals technical details in userMessage", () => {
    for (const [key, entry] of Object.entries(ERROR_CODES)) {
      expect(entry.userMessage, `${key} leaks technical info`).not.toMatch(
        /500|NetworkError|timeout|backend|API|BD/i
      );
    }
  });
});
