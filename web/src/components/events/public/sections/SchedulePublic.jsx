export default function SchedulePublic({ section, event }) {
    const items = event?.schedule || [];
  
    return (
      <section className="py-16">
        <h2 className="text-3xl font-bold text-center">{section.title}</h2>
  
        <div className="mt-8 max-w-3xl mx-auto space-y-4">
          {items.map((item) => (
            <div key={item.id} className="border p-4 rounded-lg">
              <div className="font-semibold">{item.title}</div>
              <div className="text-sm text-gray-500">{item.time}</div>
            </div>
          ))}
        </div>
      </section>
    );
  }