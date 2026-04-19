"use client";

import { useEffect, useMemo, useState } from "react";

import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useBuilderStore } from "@/store/builder.store";

function SortablePreviewItem({ section, eventId, eventDate, onSelect }) {
 
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div
  ref={setNodeRef}
  style={style}
  onClick={() => onSelect?.(section)}  // 🔥 THIS LINE ADDED
  className="relative group cursor-pointer hover:ring-2 hover:ring-black/10"
>
      <div
        {...attributes}
        {...listeners}
        className="absolute left-3 top-3 z-20 cursor-grab rounded-lg bg-white/90 px-2 py-1 text-xs shadow opacity-0 transition group-hover:opacity-100"
      >
        Drag
      </div>

      <SectionRenderer section={section} eventId={eventId} eventDate={eventDate} />
    </div>
  );
}

function SectionRenderer({ section, eventId, eventDate }) {
  const updateSection = useBuilderStore((s) => s.updateSection);

  const [localTitle, setLocalTitle] = useState(() => section.title || "");
  const [localBody, setLocalBody] = useState(() => section.body || "");

  useEffect(() => {
    const timer = setTimeout(() => {
      const changed = {};

      if (localTitle !== (section.title || "")) changed.title = localTitle;
      if (localBody !== (section.body || "")) changed.body = localBody;

      if (Object.keys(changed).length > 0) {
        updateSection(eventId, section.id, changed);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [
    localTitle,
    localBody,
    section.id,
    section.title,
    section.body,
    eventId,
    updateSection,
  ]);

  const countdownText = useMemo(() => {
    if (!eventDate) return "12d 8h 42m";

    const now = new Date();
    const target = new Date(eventDate);
    const diff = target - now;

    if (diff <= 0) return "Happening now";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    return `${days}d ${hours}h ${minutes}m`;
  }, [eventDate]);

  switch (section.section_type) {
    case "HERO":
      return (
        <section className="relative flex min-h-[420px] items-center overflow-hidden bg-gradient-to-r from-gray-950 via-gray-900 to-gray-800 text-white">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{
              backgroundImage:
                "url('[images.unsplash.com](https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1600&auto=format&fit=crop)')",
            }}
          />
          <div className="absolute inset-0 bg-black/30" />

          <div className="relative z-10 w-full px-5 py-16 md:px-16 md:py-24">
            <div className="mx-auto max-w-4xl">
              <p className="mb-4 text-xs uppercase tracking-[0.3em] text-white/70">
                Premium Event Experience
              </p>

              <input
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                placeholder="Enter event headline"
                className="w-full bg-transparent text-4xl font-bold leading-tight outline-none placeholder:text-white/40 md:text-6xl"
              />

              <textarea
                value={localBody}
                onChange={(e) => setLocalBody(e.target.value)}
                placeholder="Describe your event..."
                className="mt-6 w-full resize-none bg-transparent text-base text-white/80 outline-none placeholder:text-white/40 md:text-lg"
                rows={3}
              />

              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  type="button"
                  className="rounded-xl bg-white px-6 py-3 font-semibold text-black"
                >
                  Register Now
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-white/30 px-6 py-3 font-semibold text-white"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        </section>
      );

    case "ABOUT":
      return (
        <section className="border-b bg-white px-5 py-14 md:px-16 md:py-16">
          <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-2">
            <div>
              <p className="mb-4 text-xs uppercase tracking-[0.3em] text-gray-400">
                About Event
              </p>
              <input
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                placeholder="About title"
                className="w-full bg-transparent text-3xl font-bold text-gray-900 outline-none"
              />
            </div>

            <div>
              <textarea
                value={localBody}
                onChange={(e) => setLocalBody(e.target.value)}
                placeholder="Write event details..."
                className="min-h-[140px] w-full resize-none bg-transparent text-gray-600 outline-none"
              />
            </div>
          </div>
        </section>
      );

    case "STORY":
      return (
        <section className="bg-[#FCFAF7] px-5 py-14 md:px-16 md:py-20">
          <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
            <div className="aspect-[4/5] rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-100 to-amber-50" />
            <div>
              <p className="mb-4 text-xs uppercase tracking-[0.3em] text-rose-400">
                Story
              </p>
              <input
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                placeholder="Our story"
                className="w-full bg-transparent text-3xl font-bold text-gray-900 outline-none md:text-5xl"
              />
              <textarea
                value={localBody}
                onChange={(e) => setLocalBody(e.target.value)}
                placeholder="Tell your story..."
                className="mt-6 min-h-[140px] w-full resize-none bg-transparent text-gray-600 outline-none"
              />
            </div>
          </div>
        </section>
      );

    case "COUPLE":
      return (
        <section className="bg-white px-5 py-14 md:px-16 md:py-20">
          <div className="mx-auto max-w-6xl text-center">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-gray-400">
              Couple
            </p>
            <input
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              placeholder="Meet the Couple"
              className="w-full bg-transparent text-center text-3xl font-bold text-gray-900 outline-none md:text-5xl"
            />
            <textarea
              value={localBody}
              onChange={(e) => setLocalBody(e.target.value)}
              placeholder="Introduce the couple..."
              className="mx-auto mt-5 min-h-[80px] w-full max-w-3xl resize-none bg-transparent text-center text-gray-600 outline-none"
            />

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-gray-200 p-8">
                <div className="mx-auto h-32 w-32 rounded-full bg-gradient-to-br from-pink-100 to-rose-200" />
                <h3 className="mt-5 text-xl font-bold text-gray-900">Partner One</h3>
                <p className="mt-2 text-sm text-gray-500">
                  A short lovely introduction goes here.
                </p>
              </div>

              <div className="rounded-3xl border border-gray-200 p-8">
                <div className="mx-auto h-32 w-32 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200" />
                <h3 className="mt-5 text-xl font-bold text-gray-900">Partner Two</h3>
                <p className="mt-2 text-sm text-gray-500">
                  A short lovely introduction goes here.
                </p>
              </div>
            </div>
          </div>
        </section>
      );

    case "COUNTDOWN":
      return (
        <section className="bg-black px-5 py-16 text-white md:px-16 md:py-20">
          <div className="mx-auto max-w-5xl text-center">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-white/50">
              Countdown
            </p>
            <input
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              placeholder="Countdown title"
              className="w-full bg-transparent text-center text-3xl font-bold outline-none placeholder:text-white/30 md:text-5xl"
            />
            <textarea
              value={localBody}
              onChange={(e) => setLocalBody(e.target.value)}
              placeholder="Countdown subtitle"
              className="mx-auto mt-4 min-h-[60px] w-full max-w-2xl resize-none bg-transparent text-center text-white/70 outline-none"
            />

            <div className="mt-10 grid grid-cols-3 gap-4 md:grid-cols-4">
              {countdownText.split(" ").map((item, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6"
                >
                  <div className="text-3xl font-bold">
                    {item.replace(/[a-z]/gi, "") || "0"}
                  </div>
                  <div className="mt-2 text-xs uppercase tracking-[0.2em] text-white/50">
                    {item.includes("d")
                      ? "Days"
                      : item.includes("h")
                      ? "Hours"
                      : item.includes("m")
                      ? "Minutes"
                      : "Live"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case "VENUE":
      return (
        <section className="bg-slate-50 px-5 py-14 md:px-16 md:py-16">
          <div className="mx-auto grid max-w-6xl items-stretch gap-8 md:grid-cols-2">
            <div>
              <p className="mb-4 text-xs uppercase tracking-[0.3em] text-gray-400">
                Venue
              </p>
              <input
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                placeholder="Venue title"
                className="w-full bg-transparent text-3xl font-bold text-gray-900 outline-none"
              />
              <textarea
                value={localBody}
                onChange={(e) => setLocalBody(e.target.value)}
                placeholder="Venue details and directions..."
                className="mt-5 min-h-[120px] w-full resize-none bg-transparent text-gray-600 outline-none"
              />
              <div className="mt-6 space-y-3 text-sm text-gray-600">
                <div>📍 123 Event Avenue, Downtown</div>
                <div>🚗 Parking available onsite</div>
                <div>🕒 Doors open 1 hour before start</div>
              </div>
            </div>

            <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-gray-200 bg-gradient-to-br from-gray-200 to-gray-100 text-gray-500">
              Map Preview
            </div>
          </div>
        </section>
      );

    case "REGISTRY":
      return (
        <section className="bg-white px-5 py-14 md:px-16 md:py-16">
          <div className="mx-auto max-w-5xl text-center">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-gray-400">
              Registry
            </p>
            <input
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              placeholder="Registry title"
              className="w-full bg-transparent text-center text-3xl font-bold text-gray-900 outline-none"
            />
            <textarea
              value={localBody}
              onChange={(e) => setLocalBody(e.target.value)}
              placeholder="Share registry details..."
              className="mx-auto mt-4 min-h-[80px] w-full max-w-2xl resize-none bg-transparent text-center text-gray-600 outline-none"
            />

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {["Amazon", "Target", "Custom Gift Fund"].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-gray-200 p-6 shadow-sm"
                >
                  <h4 className="font-semibold text-gray-900">{item}</h4>
                  <p className="mt-2 text-sm text-gray-500">
                    Registry link placeholder
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case "SCHEDULE":
      return (
        <section className="bg-slate-50 px-5 py-14 md:px-16 md:py-16">
          <div className="mx-auto max-w-5xl">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-gray-400">
              Agenda
            </p>
            <input
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              placeholder="Schedule title"
              className="mb-10 w-full bg-transparent text-3xl font-bold text-gray-900 outline-none"
            />

            <div className="grid gap-4">
              {["09:00 AM", "11:00 AM", "02:00 PM"].map((time, i) => (
                <div
                  key={i}
                  className="flex items-start gap-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
                >
                  <div className="min-w-[100px] text-sm font-semibold text-black">
                    {time}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">Session Title</h4>
                    <p className="mt-1 text-sm text-gray-500">
                      Professional event content preview block.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case "SPEAKERS":
      return (
        <section className="bg-white px-5 py-14 md:px-16 md:py-16">
          <div className="mx-auto max-w-6xl">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-gray-400">
              Speakers
            </p>
            <input
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              placeholder="Speakers title"
              className="mb-8 w-full bg-transparent text-3xl font-bold text-gray-900 outline-none"
            />

            <div className="grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="rounded-3xl border border-gray-200 p-6 text-center"
                >
                  <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-gray-200 to-gray-100" />
                  <h4 className="mt-4 font-semibold text-gray-900">Speaker Name</h4>
                  <p className="mt-1 text-sm text-gray-500">Role / Company</p>
                  <p className="mt-3 text-sm text-gray-500">
                    Short professional bio preview.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case "TICKETS":
      return (
        <section className="bg-slate-50 px-5 py-14 md:px-16 md:py-16">
          <div className="mx-auto max-w-5xl">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-gray-400">
              Tickets
            </p>
            <input
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              placeholder="Tickets title"
              className="w-full bg-transparent text-3xl font-bold text-gray-900 outline-none"
            />
            <textarea
              value={localBody}
              onChange={(e) => setLocalBody(e.target.value)}
              placeholder="Tickets subtitle..."
              className="mt-4 min-h-[70px] w-full resize-none bg-transparent text-gray-600 outline-none"
            />

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                { name: "Standard", price: "$20" },
                { name: "VIP", price: "$50" },
                { name: "Group", price: "$90" },
              ].map((ticket) => (
                <div
                  key={ticket.name}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <h4 className="font-semibold text-gray-900">{ticket.name}</h4>
                  <div className="mt-3 text-3xl font-bold text-black">{ticket.price}</div>
                  <p className="mt-2 text-sm text-gray-500">
                    Ticket description placeholder.
                  </p>
                  <button className="mt-6 w-full rounded-xl bg-black px-4 py-3 font-medium text-white">
                    Select
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case "DONATIONS":
      return (
        <section className="bg-[#111827] px-5 py-16 text-white md:px-16 md:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-white/50">
              Donations
            </p>
            <input
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              placeholder="Donations title"
              className="w-full bg-transparent text-center text-3xl font-bold outline-none placeholder:text-white/40 md:text-5xl"
            />
            <textarea
              value={localBody}
              onChange={(e) => setLocalBody(e.target.value)}
              placeholder="Donation message..."
              className="mx-auto mt-4 min-h-[70px] w-full max-w-2xl resize-none bg-transparent text-center text-white/70 outline-none"
            />

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {["$10", "$25", "$50", "$100"].map((amount) => (
                <button
                  key={amount}
                  className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-white"
                >
                  {amount}
                </button>
              ))}
            </div>
          </div>
        </section>
      );
      case "GALLERY": {
        const layout = section.config?.layout || "grid";
      
        return (
          <section className="bg-white px-5 py-14 md:px-16 md:py-16">
            <div className="mx-auto max-w-6xl">
              <p className="mb-4 text-xs uppercase tracking-[0.3em] text-gray-400">
                Gallery
              </p>
      
              <input
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                placeholder="Gallery title"
                className="mb-8 w-full bg-transparent text-3xl font-bold text-gray-900 outline-none"
              />
      
              {/* 🔥 SWITCH BASED ON CONFIG */}
              {layout === "carousel" ? (
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div
                      key={item}
                      className="min-w-[260px] h-[180px] rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-200 to-gray-100"
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div
                      key={item}
                      className="aspect-[4/3] rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-200 to-gray-100"
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      }

    // case "GALLERY":
    //   return (
    //     <section className="bg-white px-5 py-14 md:px-16 md:py-16">
    //       <div className="mx-auto max-w-6xl">
    //         <p className="mb-4 text-xs uppercase tracking-[0.3em] text-gray-400">
    //           Gallery
    //         </p>
    //         <input
    //           value={localTitle}
    //           onChange={(e) => setLocalTitle(e.target.value)}
    //           placeholder="Gallery title"
    //           className="mb-8 w-full bg-transparent text-3xl font-bold text-gray-900 outline-none"
    //         />

    //         <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
    //           {[1, 2, 3, 4, 5, 6].map((item) => (
    //             <div
    //               key={item}
    //               className="aspect-[4/3] rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-200 to-gray-100"
    //             />
    //           ))}
    //         </div>
    //       </div>
    //     </section>
    //   );

    case "FAQ":
      return (
        <section className="bg-slate-50 px-5 py-14 md:px-16 md:py-16">
          <div className="mx-auto max-w-4xl">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-gray-400">
              FAQ
            </p>
            <input
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              placeholder="FAQ title"
              className="mb-8 w-full bg-transparent text-3xl font-bold text-gray-900 outline-none"
            />

            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-gray-200 bg-white p-5"
                >
                  <h4 className="font-semibold text-gray-900">
                    Common question {item}
                  </h4>
                  <p className="mt-2 text-sm text-gray-500">
                    Helpful answer content for guests and attendees.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case "CTA":
      return (
        <section className="bg-black px-5 py-16 text-white md:px-16 md:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <input
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              placeholder="Call to action title"
              className="w-full bg-transparent text-center text-3xl font-bold outline-none placeholder:text-white/40 md:text-5xl"
            />
            <textarea
              value={localBody}
              onChange={(e) => setLocalBody(e.target.value)}
              placeholder="Add final CTA message..."
              rows={2}
              className="mt-4 w-full resize-none bg-transparent text-center text-white/70 outline-none placeholder:text-white/30"
            />
            <button
              type="button"
              className="mt-8 rounded-xl bg-white px-8 py-3 font-semibold text-black"
            >
              Get Tickets
            </button>
          </div>
        </section>
      );

    default:
      return (
        <section className="rounded-2xl border border-dashed border-red-300 bg-red-50 p-8">
          <div className="text-sm font-semibold text-red-700">
            Unsupported section type: {section.section_type}
          </div>
        </section>
      );
  }
}

function getViewportClasses(viewport) {
  switch (viewport) {
    case "mobile":
      return "w-[390px] h-[844px] rounded-[2.2rem]";
    case "tablet":
      return "w-[820px] h-[1180px] rounded-[2rem]";
    default:
      return "w-full max-w-[1200px] min-h-screen rounded-[1.5rem]";
  }
}

function getViewportInnerClasses(viewport) {
  switch (viewport) {
    case "mobile":
    case "tablet":
      return "h-[calc(100%-48px)] overflow-y-auto";
    default:
      return "min-h-full";
  }
}

export default function EventPagePreview({
  eventId,
  sections = [],
  viewport = "desktop",
  eventDate,
  onSelect,
}) {
  const reorderSections = useBuilderStore((s) => s.reorderSections);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    const newOrder = arrayMove(sections, oldIndex, newIndex);

    const payload = newOrder.map((s, index) => ({
      id: s.id,
      position_order: index,
    }));

    reorderSections(eventId, payload);
  };

  return (
    <div className="flex w-full justify-center">
      <div
        className={`overflow-hidden border border-gray-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.12)] ${getViewportClasses(
          viewport
        )}`}
      >
        <div className="flex h-12 items-center gap-2 border-b bg-white px-4">
          <div className="h-3 w-3 rounded-full bg-red-400" />
          <div className="h-3 w-3 rounded-full bg-yellow-400" />
          <div className="h-3 w-3 rounded-full bg-green-400" />
          <div className="ml-4 text-xs text-gray-400">your-event-preview.com</div>
        </div>

        <div className={`bg-white ${getViewportInnerClasses(viewport)}`}>
          <div className="flex h-16 items-center justify-between border-b bg-white px-5 md:px-8">
            <div className="text-lg font-bold text-black">EventBrand</div>
            <div className="hidden items-center gap-6 text-sm text-gray-600 md:flex">
              <span>About</span>
              <span>Schedule</span>
              <span>Gallery</span>
              <span>FAQ</span>
            </div>
            <button
              type="button"
              className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
            >
              Register
            </button>
          </div>

          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-0">
                {sections.map((section) => (
                  <SortablePreviewItem
                    key={section.id}
                    section={section}
                    eventId={eventId}
                    eventDate={eventDate}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  );
}














// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { DndContext, closestCenter } from "@dnd-kit/core";
// import {
//   SortableContext,
//   useSortable,
//   verticalListSortingStrategy,
//   arrayMove,
// } from "@dnd-kit/sortable";
// import { CSS } from "@dnd-kit/utilities";
// import { useBuilderStore } from "@/store/builder.store";

// function SortablePreviewItem({ section, eventId, eventDate }) {
//   const {
//     attributes,
//     listeners,
//     setNodeRef,
//     transform,
//     transition,
//     isDragging,
//   } = useSortable({ id: section.id });

//   const style = {
//     transform: CSS.Transform.toString(transform),
//     transition,
//     zIndex: isDragging ? 50 : 1,
//   };

//   return (
//     <div ref={setNodeRef} style={style} className="relative group">
//       <div
//         {...attributes}
//         {...listeners}
//         className="absolute left-3 top-3 z-20 rounded-lg bg-white/90 px-2 py-1 text-xs shadow cursor-grab opacity-0 group-hover:opacity-100 transition"
//       >
//         Drag
//       </div>

//       <SectionRenderer
//         section={section}
//         eventId={eventId}
//         eventDate={eventDate}
//       />
//     </div>
//   );
// }

// function SectionRenderer({ section, eventId, eventDate }) {
//   const updateSection = useBuilderStore((s) => s.updateSection);

//   const [localTitle, setLocalTitle] = useState(() => section.title || "");
//   const [localBody, setLocalBody] = useState(() => section.body || "");

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       const changed = {};

//       if (localTitle !== (section.title || "")) changed.title = localTitle;
//       if (localBody !== (section.body || "")) changed.body = localBody;

//       if (Object.keys(changed).length > 0) {
//         updateSection(eventId, section.id, changed);
//       }
//     }, 700);

//     return () => clearTimeout(timer);
//   }, [
//     localTitle,
//     localBody,
//     section.id,
//     section.title,
//     section.body,
//     eventId,
//     updateSection,
//   ]);

//   const countdownText = useMemo(() => {
//     if (!eventDate) return "12d 8h 42m";
//     const now = new Date();
//     const target = new Date(eventDate);
//     const diff = target - now;

//     if (diff <= 0) return "Happening now";

//     const days = Math.floor(diff / (1000 * 60 * 60 * 24));
//     const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
//     const minutes = Math.floor((diff / (1000 * 60)) % 60);

//     return `${days}d ${hours}h ${minutes}m`;
//   }, [eventDate]);

//   switch (section.section_type) {
//     case "HERO":
//       return (
//         <section className="relative min-h-[420px] overflow-hidden bg-gradient-to-r from-gray-950 via-gray-900 to-gray-800 text-white flex items-center">
//           <div
//             className="absolute inset-0 bg-cover bg-center opacity-20"
//             style={{
//               backgroundImage:
//                 "url('[images.unsplash.com](https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1600&auto=format&fit=crop)')",
//             }}
//           />
//           <div className="absolute inset-0 bg-black/30" />

//           <div className="relative z-10 w-full px-5 py-16 md:px-16 md:py-24">
//             <div className="mx-auto max-w-4xl">
//               <p className="mb-4 text-xs uppercase tracking-[0.3em] text-white/70">
//                 Premium Event Experience
//               </p>

//               <input
//                 value={localTitle}
//                 onChange={(e) => setLocalTitle(e.target.value)}
//                 placeholder="Enter event headline"
//                 className="w-full bg-transparent text-4xl font-bold leading-tight outline-none placeholder:text-white/40 md:text-6xl"
//               />

//               <textarea
//                 value={localBody}
//                 onChange={(e) => setLocalBody(e.target.value)}
//                 placeholder="Describe your event..."
//                 className="mt-6 w-full resize-none bg-transparent text-base text-white/80 outline-none placeholder:text-white/40 md:text-lg"
//                 rows={3}
//               />

//               <div className="mt-8 flex flex-wrap gap-4">
//                 <button
//                   type="button"
//                   className="rounded-xl bg-white px-6 py-3 font-semibold text-black"
//                 >
//                   Register Now
//                 </button>
//                 <button
//                   type="button"
//                   className="rounded-xl border border-white/30 px-6 py-3 font-semibold text-white"
//                 >
//                   View Details
//                 </button>
//               </div>
//             </div>
//           </div>
//         </section>
//       );

//     case "ABOUT":
//       return (
//         <section className="border-b bg-white px-5 py-14 md:px-16 md:py-16">
//           <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-2">
//             <div>
//               <p className="mb-4 text-xs uppercase tracking-[0.3em] text-gray-400">
//                 About Event
//               </p>
//               <input
//                 value={localTitle}
//                 onChange={(e) => setLocalTitle(e.target.value)}
//                 placeholder="About title"
//                 className="w-full bg-transparent text-3xl font-bold text-gray-900 outline-none"
//               />
//             </div>
//             <div>
//               <textarea
//                 value={localBody}
//                 onChange={(e) => setLocalBody(e.target.value)}
//                 placeholder="Write event details..."
//                 className="min-h-[140px] w-full resize-none bg-transparent text-gray-600 outline-none"
//               />
//             </div>
//           </div>
//         </section>
//       );

//     case "STORY":
//       return (
//         <section className="bg-[#FCFAF7] px-5 py-14 md:px-16 md:py-20">
//           <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 items-center">
//             <div className="aspect-[4/5] rounded-3xl bg-gradient-to-br from-rose-100 to-amber-50 border border-rose-100" />
//             <div>
//               <p className="mb-4 text-xs uppercase tracking-[0.3em] text-rose-400">
//                 Story
//               </p>
//               <input
//                 value={localTitle}
//                 onChange={(e) => setLocalTitle(e.target.value)}
//                 placeholder="Our story"
//                 className="w-full bg-transparent text-3xl md:text-5xl font-bold text-gray-900 outline-none"
//               />
//               <textarea
//                 value={localBody}
//                 onChange={(e) => setLocalBody(e.target.value)}
//                 placeholder="Tell your story..."
//                 className="mt-6 min-h-[140px] w-full resize-none bg-transparent text-gray-600 outline-none"
//               />
//             </div>
//           </div>
//         </section>
//       );

//     case "COUPLE":
//       return (
//         <section className="bg-white px-5 py-14 md:px-16 md:py-20">
//           <div className="mx-auto max-w-6xl text-center">
//             <p className="mb-4 text-xs uppercase tracking-[0.3em] text-gray-400">
//               Couple
//             </p>
//             <input
//               value={localTitle}
//               onChange={(e) => setLocalTitle(e.target.value)}
//               placeholder="Meet the Couple"
//               className="w-full bg-transparent text-center text-3xl md:text-5xl font-bold text-gray-900 outline-none"
//             />
//             <textarea
//               value={localBody}
//               onChange={(e) => setLocalBody(e.target.value)}
//               placeholder="Introduce the couple..."
//               className="mx-auto mt-5 min-h-[80px] w-full max-w-3xl resize-none bg-transparent text-center text-gray-600 outline-none"
//             />

//             <div className="mt-10 grid gap-6 md:grid-cols-2">
//               <div className="rounded-3xl border border-gray-200 p-8">
//                 <div className="mx-auto h-32 w-32 rounded-full bg-gradient-to-br from-pink-100 to-rose-200" />
//                 <h3 className="mt-5 text-xl font-bold text-gray-900">Partner One</h3>
//                 <p className="mt-2 text-sm text-gray-500">A short lovely introduction goes here.</p>
//               </div>
//               <div className="rounded-3xl border border-gray-200 p-8">
//                 <div className="mx-auto h-32 w-32 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200" />
//                 <h3 className="mt-5 text-xl font-bold text-gray-900">Partner Two</h3>
//                 <p className="mt-2 text-sm text-gray-500">A short lovely introduction goes here.</p>
//               </div>
//             </div>
//           </div>
//         </section>
//       );

//     case "COUNTDOWN":
//       return (
//         <section className="bg-black px-5 py-16 text-white md:px-16 md:py-20">
//           <div className="mx-auto max-w-5xl text-center">
//             <p className="mb-4 text-xs uppercase tracking-[0.3em] text-white/50">
//               Countdown
//             </p>
//             <input
//               value={localTitle}
//               onChange={(e) => setLocalTitle(e.target.value)}
//               placeholder="Countdown title"
//               className="w-full bg-transparent text-center text-3xl md:text-5xl font-bold outline-none placeholder:text-white/30"
//             />
//             <textarea
//               value={localBody}
//               onChange={(e) => setLocalBody(e.target.value)}
//               placeholder="Countdown subtitle"
//               className="mx-auto mt-4 min-h-[60px] w-full max-w-2xl resize-none bg-transparent text-center text-white/70 outline-none"
//             />
//             <div className="mt-10 grid grid-cols-3 gap-4 md:grid-cols-4">
//               {countdownText.split(" ").map((item, i) => (
//                 <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-6">
//                   <div className="text-3xl font-bold">{item.replace(/[a-z]/gi, "") || "0"}</div>
//                   <div className="mt-2 text-xs uppercase tracking-[0.2em] text-white/50">
//                     {item.includes("d")
//                       ? "Days"
//                       : item.includes("h")
//                       ? "Hours"
//                       : item.includes("m")
//                       ? "Minutes"
//                       : "Live"}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </section>
//       );

//     case "VENUE":
//       return (
//         <section className="bg-slate-50 px-5 py-14 md:px-16 md:py-16">
//           <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 items-stretch">
//             <div>
//               <p className="mb-4 text-xs uppercase tracking-[0.3em] text-gray-400">
//                 Venue
//               </p>
//               <input
//                 value={localTitle}
//                 onChange={(e) => setLocalTitle(e.target.value)}
//                 placeholder="Venue title"
//                 className="w-full bg-transparent text-3xl font-bold text-gray-900 outline-none"
//               />
//               <textarea
//                 value={localBody}
//                 onChange={(e) => setLocalBody(e.target.value)}
//                 placeholder="Venue details and directions..."
//                 className="mt-5 min-h-[120px] w-full resize-none bg-transparent text-gray-600 outline-none"
//               />
//               <div className="mt-6 space-y-3 text-sm text-gray-600">
//                 <div>📍 123 Event Avenue, Downtown</div>
//                 <div>🚗 Parking available onsite</div>
//                 <div>🕒 Doors open 1 hour before start</div>
//               </div>
//             </div>
//             <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-gray-200 to-gray-100 min-h-[320px] flex items-center justify-center text-gray-500">
//               Map Preview
//             </div>
//           </div>
//         </section>
//       );

//     case "REGISTRY":
//       return (
//         <section className="bg-white px-5 py-14 md:px-16 md:py-16">
//           <div className="mx-auto max-w-5xl text-center">
//             <p className="mb-4 text-xs uppercase tracking-[0.3em] text-gray-400">
//               Registry
//             </p>
//             <input
//               value={localTitle}
//               onChange={(e) => setLocalTitle(e.target.value)}
//               placeholder="Registry title"
//               className="w-full bg-transparent text-center text-3xl font-bold text-gray-900 outline-none"
//             />
//             <textarea
//               value={localBody}
//               onChange={(e) => setLocalBody(e.target.value)}
//               placeholder="Share registry details..."
//               className="mx-auto mt-4 min-h-[80px] w-full max-w-2xl resize-none bg-transparent text-center text-gray-600 outline-none"
//             />
//             <div className="mt-10 grid gap-4 md:grid-cols-3">
//               {["Amazon", "Target", "Custom Gift Fund"].map((item) => (
//                 <div key={item} className="rounded-2xl border border-gray-200 p-6 shadow-sm">
//                   <h4 className="font-semibold text-gray-900">{item}</h4>
//                   <p className="mt-2 text-sm text-gray-500">Registry link placeholder</p>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </section>
//       );

//     case "SCHEDULE":
//       return (
//         <section className="bg-slate-50 px-5 py-14 md:px-16 md:py-16">
//           <div className="mx-auto max-w-5xl">
//             <p className="mb-4 text-xs uppercase tracking-[0.3em] text-gray-400">
//               Agenda
//             </p>
//             <input
//               value={localTitle}
//               onChange={(e) => setLocalTitle(e.target.value)}
//               placeholder="Schedule title"
//               className="mb-10 w-full bg-transparent text-3xl font-bold text-gray-900 outline-none"
//             />
//             <div className="grid gap-4">
//               {["09:00 AM", "11:00 AM", "02:00 PM"].map((time, i) => (
//                 <div
//                   key={i}
//                   className="flex items-start gap-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
//                 >
//                   <div className="min-w-[100px] text-sm font-semibold text-black">
//                     {time}
//                   </div>
//                   <div className="flex-1">
//                     <h4 className="font-semibold text-gray-900">Session Title</h4>
//                     <p className="mt-1 text-sm text-gray-500">
//                       Professional event content preview block.
//                     </p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </section>
//       );

//     case "SPEAKERS":
//       return (
//         <section className="bg-white px-5 py-14 md:px-16 md:py-16">
//           <div className="mx-auto max-w-6xl">
//             <p className="mb-4 text-xs uppercase tracking-[0.3em] text-gray-400">
//               Speakers
//             </p>
//             <input
//               value={localTitle}
//               onChange={(e) => setLocalTitle(e.target.value)}
//               placeholder="Speakers title"
//               className="mb-8 w-full bg-transparent text-3xl font-bold text-gray-900 outline-none"
//             />
//             <div className="grid gap-6 md:grid-cols-3">
//               {[1, 2, 3].map((item) => (
//                 <div key={item} className="rounded-3xl border border-gray-200 p-6 text-center">
//                   <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-gray-200 to-gray-100" />
//                   <h4 className="mt-4 font-semibold text-gray-900">Speaker Name</h4>
//                   <p className="mt-1 text-sm text-gray-500">Role / Company</p>
//                   <p className="mt-3 text-sm text-gray-500">Short professional bio preview.</p>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </section>
//       );

//     case "TICKETS":
//       return (
//         <section className="bg-slate-50 px-5 py-14 md:px-16 md:py-16">
//           <div className="mx-auto max-w-5xl">
//             <p className="mb-4 text-xs uppercase tracking-[0.3em] text-gray-400">
//               Tickets
//             </p>
//             <input
//               value={localTitle}
//               onChange={(e) => setLocalTitle(e.target.value)}
//               placeholder="Tickets title"
//               className="w-full bg-transparent text-3xl font-bold text-gray-900 outline-none"
//             />
//             <textarea
//               value={localBody}
//               onChange={(e) => setLocalBody(e.target.value)}
//               placeholder="Tickets subtitle..."
//               className="mt-4 min-h-[70px] w-full resize-none bg-transparent text-gray-600 outline-none"
//             />
//             <div className="mt-8 grid gap-4 md:grid-cols-3">
//               {[
//                 { name: "Standard", price: "$20" },
//                 { name: "VIP", price: "$50" },
//                 { name: "Group", price: "$90" },
//               ].map((ticket) => (
//                 <div key={ticket.name} className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm">
//                   <h4 className="font-semibold text-gray-900">{ticket.name}</h4>
//                   <div className="mt-3 text-3xl font-bold text-black">{ticket.price}</div>
//                   <p className="mt-2 text-sm text-gray-500">Ticket description placeholder.</p>
//                   <button className="mt-6 w-full rounded-xl bg-black px-4 py-3 text-white font-medium">
//                     Select
//                   </button>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </section>
//       );

//     case "DONATIONS":
//       return (
//         <section className="bg-[#111827] px-5 py-16 text-white md:px-16 md:py-20">
//           <div className="mx-auto max-w-4xl text-center">
//             <p className="mb-4 text-xs uppercase tracking-[0.3em] text-white/50">
//               Donations
//             </p>
//             <input
//               value={localTitle}
//               onChange={(e) => setLocalTitle(e.target.value)}
//               placeholder="Donations title"
//               className="w-full bg-transparent text-center text-3xl md:text-5xl font-bold outline-none placeholder:text-white/40"
//             />
//             <textarea
//               value={localBody}
//               onChange={(e) => setLocalBody(e.target.value)}
//               placeholder="Donation message..."
//               className="mx-auto mt-4 min-h-[70px] w-full max-w-2xl resize-none bg-transparent text-center text-white/70 outline-none"
//             />
//             <div className="mt-8 flex flex-wrap justify-center gap-3">
//               {["$10", "$25", "$50", "$100"].map((amount) => (
//                 <button
//                   key={amount}
//                   className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-white"
//                 >
//                   {amount}
//                 </button>
//               ))}
//             </div>
//           </div>
//         </section>
//       );

//     case "GALLERY":
//       return (
//         <section className="bg-white px-5 py-14 md:px-16 md:py-16">
//           <div className="mx-auto max-w-6xl">
//             <p className="mb-4 text-xs uppercase tracking-[0.3em] text-gray-400">
//               Gallery
//             </p>
//             <input
//               value={localTitle}
//               onChange={(e) => setLocalTitle(e.target.value)}
//               placeholder="Gallery title"
//               className="mb-8 w-full bg-transparent text-3xl font-bold text-gray-900 outline-none"
//             />
//             <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
//               {[1, 2, 3, 4, 5, 6].map((item) => (
//                 <div
//                   key={item}
//                   className="aspect-[4/3] rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-200 to-gray-100"
//                 />
//               ))}
//             </div>
//           </div>
//         </section>
//       );

//     case "FAQ":
//       return (
//         <section className="bg-slate-50 px-5 py-14 md:px-16 md:py-16">
//           <div className="mx-auto max-w-4xl">
//             <p className="mb-4 text-xs uppercase tracking-[0.3em] text-gray-400">
//               FAQ
//             </p>
//             <input
//               value={localTitle}
//               onChange={(e) => setLocalTitle(e.target.value)}
//               placeholder="FAQ title"
//               className="mb-8 w-full bg-transparent text-3xl font-bold text-gray-900 outline-none"
//             />
//             <div className="space-y-4">
//               {[1, 2, 3].map((item) => (
//                 <div key={item} className="rounded-2xl border border-gray-200 bg-white p-5">
//                   <h4 className="font-semibold text-gray-900">
//                     Common question {item}
//                   </h4>
//                   <p className="mt-2 text-sm text-gray-500">
//                     Helpful answer content for guests and attendees.
//                   </p>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </section>
//       );

//     case "CTA":
//       return (
//         <section className="bg-black px-5 py-16 text-white md:px-16 md:py-20">
//           <div className="mx-auto max-w-4xl text-center">
//             <input
//               value={localTitle}
//               onChange={(e) => setLocalTitle(e.target.value)}
//               placeholder="Call to action title"
//               className="w-full bg-transparent text-center text-3xl font-bold outline-none placeholder:text-white/40 md:text-5xl"
//             />
//             <textarea
//               value={localBody}
//               onChange={(e) => setLocalBody(e.target.value)}
//               placeholder="Add final CTA message..."
//               rows={2}
//               className="mt-4 w-full resize-none bg-transparent text-center text-white/70 outline-none placeholder:text-white/30"
//             />
//             <button
//               type="button"
//               className="mt-8 rounded-xl bg-white px-8 py-3 font-semibold text-black"
//             >
//               Get Tickets
//             </button>
//           </div>
//         </section>
//       );

//     default:
//       return (
//         <section className="rounded-2xl border border-dashed border-red-300 bg-red-50 p-8">
//           <div className="text-sm font-semibold text-red-700">
//             Unsupported section type: {section.section_type}
//           </div>
//         </section>
//       );
//   }
// }

// function getViewportClasses(viewport) {
//   switch (viewport) {
//     case "mobile":
//       return "w-[390px] h-[844px] rounded-[2.2rem]";
//     case "tablet":
//       return "w-[820px] h-[1180px] rounded-[2rem]";
//     default:
//       return "w-full max-w-[1200px] min-h-screen rounded-[1.5rem]";
//   }
// }

// function getViewportInnerClasses(viewport) {
//   switch (viewport) {
//     case "mobile":
//     case "tablet":
//       return "h-[calc(100%-48px)] overflow-y-auto";
//     default:
//       return "min-h-full";
//   }
// }

// export default function EventPagePreview({
//   eventId,
//   sections = [],
//   viewport = "desktop",
//   eventDate,
// }) {
//   const reorderSections = useBuilderStore((s) => s.reorderSections);

//   const handleDragEnd = (event) => {
//     const { active, over } = event;
//     if (!over || active.id === over.id) return;

//     const oldIndex = sections.findIndex((s) => s.id === active.id);
//     const newIndex = sections.findIndex((s) => s.id === over.id);
//     const newOrder = arrayMove(sections, oldIndex, newIndex);

//     const payload = newOrder.map((s, index) => ({
//       id: s.id,
//       position_order: index,
//     }));

//     reorderSections(eventId, payload);
//   };

//   return (
//     <div className="flex w-full justify-center">
//       <div
//         className={`overflow-hidden border border-gray-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.12)] ${getViewportClasses(viewport)}`}
//       >
//         <div className="flex h-12 items-center gap-2 border-b bg-white px-4">
//           <div className="h-3 w-3 rounded-full bg-red-400" />
//           <div className="h-3 w-3 rounded-full bg-yellow-400" />
//           <div className="h-3 w-3 rounded-full bg-green-400" />
//           <div className="ml-4 text-xs text-gray-400">your-event-preview.com</div>
//         </div>

//         <div className={`bg-white ${getViewportInnerClasses(viewport)}`}>
//           <div className="flex h-16 items-center justify-between border-b bg-white px-5 md:px-8">
//             <div className="text-lg font-bold text-black">EventBrand</div>
//             <div className="hidden items-center gap-6 text-sm text-gray-600 md:flex">
//               <span>About</span>
//               <span>Schedule</span>
//               <span>Gallery</span>
//               <span>FAQ</span>
//             </div>
//             <button
//               type="button"
//               className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
//             >
//               Register
//             </button>
//           </div>

//           <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
//             <SortableContext
//               items={sections.map((s) => s.id)}
//               strategy={verticalListSortingStrategy}
//             >
//               <div className="space-y-0">
//                 {sections.map((section) => (
//                   <SortablePreviewItem
//                     key={section.id}
//                     section={section}
//                     eventId={eventId}
//                     eventDate={eventDate}
//                   />
//                 ))}
//               </div>
//             </SortableContext>
//           </DndContext>
//         </div>
//       </div>
//     </div>
//   );
// }





