import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PortraitSwap } from "@/components/home/PortraitSwap";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const rest = Object.fromEntries(Object.entries(props).filter(([k]) => !["fill", "priority", "fetchPriority"].includes(k)));
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...rest} />;
  },
}));

const focus = { x: 50, y: 30 };
const pair = { real: "/images/profile/portrait-real.webp", illustrated: "/images/profile/portrait-illustrated.webp", focus };

describe("PortraitSwap", () => {
  it("shows an intentional placeholder, and no image requests, when no assets exist", () => {
    const { container } = render(<PortraitSwap pair={{ real: null, illustrated: null, focus }} />);
    expect(screen.getByRole("img", { name: /Portrait placeholder/ })).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("button")).toBeNull();
    expect(container.querySelector(".pswap")).toHaveAttribute("data-mode", "placeholder");
  });

  it("shows a single asset statically", () => {
    render(<PortraitSwap pair={{ real: "/images/profile/portrait-real.webp", illustrated: null, focus }} />);
    expect(screen.getByRole("img", { name: "Photograph of Sreevarshan Sathiyamurthy" })).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("starts illustrated, with both images stacked in the same box", () => {
    const { container } = render(<PortraitSwap pair={pair} />);
    const fig = container.querySelector(".pswap")!;
    expect(fig).toHaveAttribute("data-state", "illustrated");
    const imgs = container.querySelectorAll("img");
    expect([...imgs].map((i) => i.getAttribute("src"))).toEqual([pair.illustrated, pair.real]);
    // Same crop for both layers, so the faces line up.
    expect(imgs[0].style.objectPosition).toBe(imgs[1].style.objectPosition);
    // The photo is preloaded so the first reveal never shows an empty frame.
    expect(imgs[1]).toHaveAttribute("loading", "eager");
  });

  it("reveals the photo on mouse hover and returns on leave", () => {
    const { container } = render(<PortraitSwap pair={pair} />);
    const fig = container.querySelector(".pswap")!;
    const btn = screen.getByRole("button", { name: /Show photograph/ });
    fireEvent.pointerEnter(btn, { pointerType: "mouse", clientX: 10, clientY: 10 });
    expect(fig).toHaveAttribute("data-state", "real");
    fireEvent.pointerLeave(btn, { pointerType: "mouse" });
    expect(fig).toHaveAttribute("data-state", "illustrated");
  });

  it("toggles with a tap on touch devices (hover is ignored)", () => {
    const { container } = render(<PortraitSwap pair={pair} />);
    const fig = container.querySelector(".pswap")!;
    const btn = screen.getByRole("button", { name: /Show photograph/ });
    fireEvent.pointerEnter(btn, { pointerType: "touch" });
    expect(fig).toHaveAttribute("data-state", "illustrated");
    fireEvent.pointerDown(btn, { pointerType: "touch" });
    fireEvent.click(btn, { detail: 1 });
    expect(fig).toHaveAttribute("data-state", "real");
    expect(btn).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(btn, { detail: 1 });
    expect(fig).toHaveAttribute("data-state", "illustrated");
    expect(btn).toHaveAttribute("aria-pressed", "false");
  });

  it("is keyboard operable: Tab to focus, Enter and Space toggle", async () => {
    const { container } = render(<PortraitSwap pair={pair} />);
    const fig = container.querySelector(".pswap")!;
    await userEvent.tab();
    const btn = screen.getByRole("button", { name: /Show photograph/ });
    expect(btn).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(fig).toHaveAttribute("data-state", "real");
    expect(screen.getByText("Showing the photograph.")).toBeInTheDocument();
    await userEvent.keyboard(" ");
    expect(fig).toHaveAttribute("data-state", "illustrated");
  });
});
