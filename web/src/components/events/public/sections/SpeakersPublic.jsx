import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function SpeakersPublic({ section, event }) {
  const [speakers, setSpeakers] = useState([]);

  useEffect(() => {
    api.get(`/events/${event.id}/speakers`).then((res) => {
      setSpeakers(res.data.data);
    });
  }, [event.id]);

  return (
    <section className="py-16 text-center">
      <h2 className="text-3xl font-bold">{section.title}</h2>

      <div className="grid md:grid-cols-3 gap-6 mt-8">
        {speakers.map((s) => (
          <div key={s.id} className="border p-4 rounded-xl">
            <h4>{s.name}</h4>
            <p>{s.title}</p>
          </div>
        ))}
      </div>
    </section>
  );
}