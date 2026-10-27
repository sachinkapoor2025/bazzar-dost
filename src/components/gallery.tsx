"use client";

import Image from "next/image";
import { useState } from "react";

export function Gallery({ images, name }: { images: Array<{ url: string; alt: string }>; name: string }) {
  const [index, setIndex] = useState(0);
  const current = images[index] || { url: "", alt: name };
  return (
    <div>
      <div className="aspect-square overflow-hidden rounded-3xl bg-cream-100">
        {current.url ? (
          <Image src={current.url} alt={current.alt || name} width={800} height={800} priority unoptimized={current.url.endsWith(".svg")} className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full place-items-center font-display text-3xl text-forest-800">BD</span>
        )}
      </div>
      {images.length > 1 ? (
        <div className="mt-3 flex gap-2">
          {images.map((image, imageIndex) => (
            <button key={image.url} type="button" className={`h-16 w-16 overflow-hidden rounded-xl border ${imageIndex === index ? "border-forest-800" : "border-cream-300"}`} onClick={() => setIndex(imageIndex)} aria-label={`Show image ${imageIndex + 1}`}>
              <Image src={image.url} alt="" width={64} height={64} unoptimized={image.url.endsWith(".svg")} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
