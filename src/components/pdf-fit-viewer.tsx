"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

type FittedPage = { url: string; width: number; height: number };

export function PdfFitViewer({ src, title }: { src: string; title: string }) {
  const shellRef = useRef<HTMLDivElement>(null);
  const urlsRef = useRef<string[]>([]);
  const [pages, setPages] = useState<FittedPage[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    let cancelled = false;
    let doc: PDFDocumentProxy | null = null;
    let renderId = 0;
    let timer = 0;
    let lastWidth = 0;

    function commit(next: FittedPage[]) {
      const stale = urlsRef.current;
      urlsRef.current = next.map((page) => page.url);
      setPages(next);
      window.setTimeout(() => stale.forEach((url) => URL.revokeObjectURL(url)), 0);
    }

    async function draw(id: number) {
      if (!doc || cancelled || id !== renderId) return;
      const width = shell.clientWidth;
      if (width < 8) return;
      const headerHeight = document.querySelector("header")?.getBoundingClientRect().height ?? 0;
      const maxHeight = Math.max(320, window.innerHeight - headerHeight - 16);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const next: FittedPage[] = [];
      for (let index = 1; index <= doc.numPages; index += 1) {
        if (cancelled || id !== renderId) return;
        const page = await doc.getPage(index);
        const base = page.getViewport({ scale: 1 });
        const fit = Math.min(width / base.width, maxHeight / base.height);
        const viewport = page.getViewport({ scale: fit * dpr });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const context = canvas.getContext("2d");
        if (!context) return;
        await page.render({ canvasContext: context, viewport }).promise;
        if (cancelled || id !== renderId) return;
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
        if (!blob || cancelled || id !== renderId) return;
        next.push({
          url: URL.createObjectURL(blob),
          width: Math.floor(viewport.width / dpr),
          height: Math.floor(viewport.height / dpr),
        });
      }
      if (cancelled || id !== renderId) {
        next.forEach((page) => URL.revokeObjectURL(page.url));
        return;
      }
      commit(next);
    }

    function schedule(force = false) {
      const width = shell.clientWidth;
      if (!force && width === lastWidth && urlsRef.current.length > 0) return;
      lastWidth = width;
      const id = ++renderId;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        void draw(id).catch(() => {
          if (!cancelled && id === renderId) setError(true);
        });
      }, 60);
    }

    function blockScale(event: WheelEvent) {
      if (event.ctrlKey) event.preventDefault();
    }

    shell.addEventListener("wheel", blockScale, { passive: false });
    const observer = new ResizeObserver(() => schedule());
    observer.observe(shell);
    const onResize = () => schedule(true);
    window.addEventListener("resize", onResize);

    void (async () => {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      doc = await pdfjs.getDocument({ url: src }).promise;
      if (cancelled) {
        await doc.destroy();
        doc = null;
        return;
      }
      schedule();
    })().catch(() => {
      if (!cancelled) setError(true);
    });

    return () => {
      cancelled = true;
      renderId += 1;
      window.clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      shell.removeEventListener("wheel", blockScale);
      urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      urlsRef.current = [];
      void doc?.destroy();
    };
  }, [src]);

  return (
    <div ref={shellRef} className="w-full bg-cream-100 py-3" style={{ touchAction: "pan-y" }}>
      {error ? (
        <p className="px-4 py-8 text-center text-sm text-muted">This certificate could not be shown here. Use View certificate or Download.</p>
      ) : pages.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted">Opening certificate…</p>
      ) : (
        <div className="flex w-full flex-col items-center gap-3">
          {pages.map((page, index) => (
            <img
              key={page.url}
              src={page.url}
              alt={`${title}, page ${index + 1} of ${pages.length}`}
              width={page.width}
              height={page.height}
              draggable={false}
              className="pointer-events-none block select-none"
              style={{ width: page.width, height: page.height }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
