export default function Tabs({ activeTab, setActiveTab }) {
    const tabs = ["details", "location", "tickets", "settings"];
  
    return (
      <div className="flex gap-2 border-b pb-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-xl text-sm capitalize ${
              activeTab === t
                ? "bg-black text-white"
                : "bg-gray-100"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    );
  }