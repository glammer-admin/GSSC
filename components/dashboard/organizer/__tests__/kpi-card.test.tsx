import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KpiCard } from "../kpi-card";
import { DollarSign } from "lucide-react";

describe("KpiCard", () => {
  const defaultProps = {
    title: "Comisión Total",
    value: 15000,
    icon: DollarSign,
  };

  it("renders title and value", () => {
    render(<KpiCard {...defaultProps} />);
    expect(screen.getByText("Comisión Total")).toBeInTheDocument();
    expect(screen.getByText("15,000")).toBeInTheDocument();
  });

  it("formats value as MXN currency when formatAsCurrency is true", () => {
    render(<KpiCard {...defaultProps} formatAsCurrency />);
    expect(screen.getByText(/\$15,000/)).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<KpiCard {...defaultProps} description="Este mes" />);
    expect(screen.getByText("Este mes")).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    render(<KpiCard {...defaultProps} />);
    expect(screen.queryByText("Este mes")).not.toBeInTheDocument();
  });

  it("renders positive trend in green", () => {
    render(
      <KpiCard {...defaultProps} trend={{ value: 12, isPositive: true }} />
    );
    const trend = screen.getByText("+12% vs periodo anterior");
    expect(trend).toBeInTheDocument();
    expect(trend.className).toContain("emerald");
  });

  it("renders negative trend in red", () => {
    render(
      <KpiCard {...defaultProps} trend={{ value: 5, isPositive: false }} />
    );
    const trend = screen.getByText("5% vs periodo anterior");
    expect(trend).toBeInTheDocument();
    expect(trend.className).toContain("red");
  });

  it("handles string value", () => {
    render(<KpiCard {...defaultProps} value="N/A" />);
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });
});
