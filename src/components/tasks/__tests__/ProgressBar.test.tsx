import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProgressBar } from "../ProgressBar";

describe("ProgressBar", () => {
  it("renderiza modo read-only com label %", () => {
    render(<ProgressBar value={42} />);
    expect(screen.getByText("42%")).toBeInTheDocument();
  });

  it("clamp valores fora de 0-100", () => {
    render(<ProgressBar value={150} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("modo thin não mostra label", () => {
    render(<ProgressBar value={50} thin />);
    expect(screen.queryByText("50%")).not.toBeInTheDocument();
  });

  it("dispara onChange com debounce ao mover slider", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(<ProgressBar value={20} onChange={onChange} />);
    // Slider Radix expõe role="slider".
    const slider = screen.getByRole("slider");
    expect(slider).toBeInTheDocument();
    // Simula via teclado para incrementar.
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    vi.advanceTimersByTime(350);
    expect(onChange).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
