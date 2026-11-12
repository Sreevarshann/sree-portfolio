import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LogoImage } from "@/components/ui/LogoImage";
import { BrandIcon, iconFor } from "@/components/ui/BrandIcon";
import { TechChip } from "@/components/ui/TechChip";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

describe("brand assets", () => {
  it("falls back to typography when a logo fails to load", () => {
    render(<LogoImage src="/logos/missing.svg" alt="Acme logo" width={100} height={20} fallback="Acme" />);
    fireEvent.error(screen.getByRole("img", { name: "Acme logo" }));
    expect(screen.getByRole("img", { name: "Acme logo" })).toHaveTextContent("Acme");
  });

  it("maps technology names to icons and renders nothing for unknown names", () => {
    expect(iconFor("PostgreSQL 16 + pgvector")?.title).toBe("PostgreSQL");
    expect(iconFor("Some internal tool")).toBeUndefined();
    const { container } = render(<BrandIcon name="definitely-not-a-brand" />);
    expect(container.firstChild).toBeNull();
  });

  it("tech chips keep their text label with or without an icon", () => {
    render(
      <>
        <TechChip name="FastAPI" />
        <TechChip name="Stored procedures" />
      </>,
    );
    expect(screen.getByText("FastAPI").querySelector("svg")).not.toBeNull();
    expect(screen.getByText("Stored procedures").querySelector("svg")).toBeNull();
  });
});
