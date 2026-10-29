"use client";

import Image from "next/image";
import { useState } from "react";
import { unoptimizedImage } from "@/lib/format";

export function Gallery({ images, name }: { images: Array<{ url: string; alt: string }>; name: string }) {
  const [index, setIndex] = useState(0);
  const [enlarged, setEnlarged] = useState(false);
  const [failed, setFailed] = useState(false);
  const current = images[index] || { url: "", alt: name };
  const showImage = Boolean(current.url) && !failed;
  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-cream-100">
        {showImage ? (
          <Image src={current.url} alt={current.alt || name} width={800} height={800} priority unoptimized={unoptimizedImage(current.url)} className="h-full w-full object-cover" onError={() => setFailed(true)} />
        ) : (
          <span className="grid h-full place-items-center font-display text-3xl text-forest-800">BD</span>
        )}
        {showImage ? (
          <button type="button" className="absolute bottom-3 right-3 min-h-11 rounded-full bg-cream-50 px-3 text-sm font-semibold text-forest-900" onClick={() => setEnlarged(true)}>
            Enlarge
          </button>
        ) : null}
      </div>
      {enlarged && current.url ? (
        <dialog open className="fixed inset-0 z-50 grid h-full max-h-none w-full max-w-none place-items-center bg-forest-950/80 p-4" aria-label={`${name} enlarged`}>
          <button type="button" className="absolute right-4 top-4 min-h-11 rounded-full bg-cream-50 px-4 text-sm font-semibold" onClick={() => setEnlarged(false)}>Close</button>
          <Image src={current.url} alt={current.alt || name} width={1200} height={1200} unoptimized={unoptimizedImage(current.url)} className="max-h-[85vh] w-auto max-w-full object-contain" />
        </dialog>
      ) : null}
      {images.length > 1 ? (
        <div className="mt-3 flex gap-2">
          {images.map((image, imageIndex) => (
            <button key={image.url} type="button" className={`h-16 w-16 overflow-hidden rounded-xl border ${imageIndex === index ? "border-forest-800" : "border-cream-300"}`} onClick={() => { setFailed(false); setIndex(imageIndex); }} aria-label={`Show image ${imageIndex + 1}`}>
              <Image src={image.url} alt="" width={64} height={64} unoptimized={unoptimizedImage(image.url)} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
