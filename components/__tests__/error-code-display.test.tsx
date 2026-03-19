import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorCodeDisplay } from "../error-code-display";

describe("ErrorCodeDisplay", () => {
  it("renders the error code", () => {
    render(<ErrorCodeDisplay code="AUTH-NET-001" />);
    expect(screen.getByText(/AUTH-NET-001/)).toBeInTheDocument();
  });

  it("copies code to clipboard on click", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    render(<ErrorCodeDisplay code="AUTH-NET-001" />);
    await user.click(screen.getByRole("button"));

    expect(writeText).toHaveBeenCalledWith("AUTH-NET-001");
  });

  it("shows copied feedback after click", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });

    render(<ErrorCodeDisplay code="AUTH-NET-001" />);
    await user.click(screen.getByRole("button"));

    expect(await screen.findByText("¡Copiado!")).toBeInTheDocument();
  });

  it("has correct title attribute", () => {
    render(<ErrorCodeDisplay code="ERR-GEN-000" />);
    expect(screen.getByTitle("Click para copiar el código")).toBeInTheDocument();
  });
});
