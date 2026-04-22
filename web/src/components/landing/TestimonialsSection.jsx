"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

function TestimonialCard({ t, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
        delay: index * 0.1,
      }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300"
    >
      <div className="flex text-amber-400 text-sm mb-4" aria-label="5 stars">
        {"★★★★★"}
      </div>
      <p className="text-gray-600 text-sm leading-relaxed mb-5">
        &ldquo;{t.text}&rdquo;
      </p>
      <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 shrink-0">
          <Image
            src={t.avatar}
            alt={t.name}
            width={40}
            height={40}
            className="object-cover"
            loading="lazy"
          />
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
          <p className="text-gray-400 text-xs">
            {t.location} · {t.template}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function TestimonialsSection({ testimonials }) {
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-80px" });

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-14"
        >
          <span className="text-amber-600 text-sm font-bold uppercase tracking-widest">
            Love Stories
          </span>
          <h2 className="mt-2 text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
            Couples who used WedSite
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <TestimonialCard key={t.name} t={t} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
