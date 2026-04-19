"use client";

export default function Sidebar() {
  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h2 className="text-lg font-semibold">
          Event Builder
        </h2>
        <p className="text-sm text-gray-500">
          Customize your event page
        </p>
      </div>

      {/* TEMPLATE */}
      <div>
        <p className="text-xs text-gray-400 mb-2">
          QUICK START
        </p>

        <select className="w-full border p-3 rounded-xl">
          <option>Choose Template</option>
          <option>Classic</option>
          <option>Wedding</option>
          <option>Corporate</option>
          <option>Birthday</option>
        </select>
      </div>

      {/* ADD CONTENT */}
      <div>
        <p className="text-xs text-gray-400 mb-2">
          ADD CONTENT
        </p>

        <div className="grid grid-cols-2 gap-2">
          <button className="btn">Hero</button>
          <button className="btn">About</button>
          <button className="btn">Gallery</button>
          <button className="btn">Schedule</button>
          <button className="btn">FAQ</button>
          <button className="btn">CTA</button>
        </div>
      </div>

      {/* PAGE LAYERS */}
      <div>
        <p className="text-xs text-gray-400 mb-2">
          PAGE LAYERS
        </p>

        <div className="space-y-2">
          <div className="flex justify-between border p-3 rounded-xl">
            <span>Hero</span>
            <button className="text-xs text-gray-500">
              Edit
            </button>
          </div>

          <div className="flex justify-between border p-3 rounded-xl">
            <span>Gallery</span>
            <button className="text-xs text-gray-500">
              Edit
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}