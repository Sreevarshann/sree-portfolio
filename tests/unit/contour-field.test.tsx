import { StrictMode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { ContourField } from "@/components/home/ContourField";

/**
 * Regression: in development, Strict Mode mounted → unmounted → remounted the
 * field. The cleanup released the WebGL context and the remount reused the same
 * <canvas>, which Chrome then painted as an opaque white box over the dark hero.
 */
function fakeGl(lost: { value: boolean }) {
  const noop = () => {};
  return {
    VERTEX_SHADER: 1, FRAGMENT_SHADER: 2, ARRAY_BUFFER: 3, STATIC_DRAW: 4, FLOAT: 5, BLEND: 6, ONE: 7, ONE_MINUS_SRC_ALPHA: 8, COLOR_BUFFER_BIT: 9, TRIANGLES: 10, LINK_STATUS: 11,
    createShader: () => ({}), shaderSource: noop, compileShader: noop, createProgram: () => ({}), attachShader: noop, linkProgram: noop,
    getProgramParameter: () => true, isContextLost: () => lost.value, useProgram: noop, createBuffer: () => ({}), bindBuffer: noop, bufferData: noop,
    getAttribLocation: () => 0, enableVertexAttribArray: noop, vertexAttribPointer: noop, enable: noop, blendFunc: noop, getUniformLocation: () => ({}),
    uniform1f: noop, uniform2f: noop, uniform3f: noop, clearColor: noop, clear: noop, drawArrays: noop, viewport: noop,
    getExtension: (name: string) => (name === "WEBGL_lose_context" ? { loseContext: () => (lost.value = true) } : null),
  };
}

describe("ContourField", () => {
  it("uses a fresh canvas after a Strict Mode remount and leaves exactly one", () => {
    const contexts = new Map<HTMLCanvasElement, { value: boolean }>();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function (this: HTMLCanvasElement) {
      const lost = { value: false };
      contexts.set(this, lost);
      return fakeGl(lost) as unknown as WebGL2RenderingContext;
    } as unknown as HTMLCanvasElement["getContext"]);
    vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
    vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} });
    vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });

    const { container, unmount } = render(
      <StrictMode>
        <ContourField />
      </StrictMode>,
    );
    const canvases = container.querySelectorAll("canvas");
    expect(canvases).toHaveLength(1);
    expect(contexts.size).toBe(2); // two mounts → two distinct canvases
    expect(contexts.get(canvases[0])!.value).toBe(false); // the visible one is alive
    unmount();
    expect(container.querySelectorAll("canvas")).toHaveLength(0);
  });
});
