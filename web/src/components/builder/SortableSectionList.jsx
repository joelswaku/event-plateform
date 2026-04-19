

// "use client";

// import { useState } from "react";
// import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
// import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
// import { CSS } from "@dnd-kit/utilities";
// import { useBuilderStore } from "@/store/builder.store";

// function SortableItem({ section, eventId, onDelete, onUpdate }) {
//   const [isEditing, setIsEditing] = useState(false);
  
//   // Initialize state directly from props. 
//   // We removed useEffect. If the parent re-renders with new section data, 
//   // we use the 'isEditing' toggle to refresh or just trust the initial state 
//   // for the duration of the edit session.
//   const [formData, setFormData] = useState({ 
//     title: section.title || "",
//     body: section.body || "",
//     section_type: section.section_type
//   });

//   const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });

//   const style = {
//     transform: CSS.Transform.toString(transform),
//     transition,
//     zIndex: isDragging ? 50 : 1,
//   };

//   const handleUpdate = async () => {
//     await onUpdate(eventId, section.id, formData);
//     setIsEditing(false);
//   };

//   return (
//     <div 
//       ref={setNodeRef} 
//       style={style} 
//       className={`group mb-3 overflow-hidden rounded-2xl border transition-all duration-200 ${
//         isDragging ? "border-black shadow-xl scale-[1.02] bg-white" : "border-gray-100 bg-white shadow-sm"
//       }`}
//     >
//       <div className="flex items-center justify-between p-4 bg-white">
//         <div className="flex items-center gap-4 flex-1">
//           <div {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-black transition-colors">
//             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//               <circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/>
//               <circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/>
//             </svg>
//           </div>
          
//           <div>
//             <div className="flex items-center gap-2">
//               <span className="text-[10px] font-bold uppercase tracking-tighter bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
//                 {section.section_type}
//               </span>
//               <h3 className="text-sm font-semibold text-gray-900">{section.title || "Untitled Section"}</h3>
//             </div>
//           </div>
//         </div>

//         <div className="flex items-center gap-3">
//           <button 
//             onClick={() => setIsEditing(!isEditing)}
//             className="text-xs font-bold text-gray-500 hover:text-black uppercase tracking-wider transition-colors"
//           >
//             {isEditing ? "Close" : "Edit"}
//           </button>
//           <button 
//             onClick={() => onDelete(section.id)}
//             className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all opacity-0 group-hover:opacity-100"
//           >
//             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//               <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
//             </svg>
//           </button>
//         </div>
//       </div>

//       {isEditing && (
//         <div className="border-t border-gray-50 bg-gray-50/50 p-5 space-y-4">
//           <div className="space-y-1">
//             <label className="text-[10px] font-bold text-gray-400 uppercase">Heading</label>
//             <input
//               value={formData.title}
//               onChange={(e) => setFormData({ ...formData, title: e.target.value })}
//               className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-black/5 outline-none shadow-sm"
//               placeholder="e.g. Welcome to the event"
//             />
//           </div>
//           <div className="space-y-1">
//             <label className="text-[10px] font-bold text-gray-400 uppercase">Body Content</label>
//             <textarea
//               value={formData.body}
//               onChange={(e) => setFormData({ ...formData, body: e.target.value })}
//               className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-black/5 outline-none shadow-sm min-h-[100px]"
//               placeholder="Tell your guests about this section..."
//             />
//           </div>
//           <button 
//             onClick={handleUpdate}
//             className="w-full bg-black text-white py-3 rounded-xl text-xs font-bold shadow-lg hover:shadow-none transition-all active:scale-[0.98]"
//           >
//             Update Section
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

// export default function SortableSectionList({ eventId, sections }) {
//   const { reorderSections, deleteSection, updateSection } = useBuilderStore();
//   const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

//   const handleDragEnd = async (event) => {
//     const { active, over } = event;
//     if (!over || active.id === over.id) return;

//     const oldIndex = sections.findIndex((s) => s.id === active.id);
//     const newIndex = sections.findIndex((s) => s.id === over.id);
//     const newItems = arrayMove(sections, oldIndex, newIndex);

//     const payload = newItems.map((s, index) => ({
//       id: s.id,
//       position_order: index + 1,
//     }));

//     await reorderSections(eventId, payload);
//   };

//   return (
//     <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
//       <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
//         <div className="flex flex-col">
//           {sections.map((section) => (
//             <SortableItem 
//               // KEY TIP: If you want the form to reset when data changes 
//               // from the server, you can use `key={section.id + section.updated_at}`
//               key={section.id} 
//               section={section} 
//               eventId={eventId}
//               onDelete={(id) => deleteSection(eventId, id)}
//               onUpdate={updateSection}
//             />
//           ))}
//         </div>
//       </SortableContext>
//     </DndContext>
//   );
// }






"use client";

import { useState, useEffect } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useBuilderStore } from "@/store/builder.store";
function SortableItem({ section, eventId, onDelete, onUpdate }) {
    const [isEditing, setIsEditing] = useState(false);
    
    // Initialize state directly from props. 
    // We removed useEffect. If the parent re-renders with new section data, 
    // we use the 'isEditing' toggle to refresh or just trust the initial state 
    // for the duration of the edit session.
    const [formData, setFormData] = useState({ 
      title: section.title || "",
      body: section.body || "",
      section_type: section.section_type
    });
  
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 50 : 1,
    };
  
    const handleUpdate = async () => {
      await onUpdate(eventId, section.id, formData);
      setIsEditing(false);
    };
  
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        className={`group mb-3 overflow-hidden rounded-2xl border transition-all duration-200 ${
          isDragging ? "border-black shadow-xl scale-[1.02] bg-white" : "border-gray-100 bg-white shadow-sm"
        }`}
      >
        <div className="flex items-center justify-between p-4 bg-white">
          <div className="flex items-center gap-4 flex-1">
            <div {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-black transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/>
                <circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/>
              </svg>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-tighter bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                  {section.section_type}
                </span>
                <h3 className="text-sm font-semibold text-gray-900">{section.title || "Untitled Section"}</h3>
              </div>
            </div>
          </div>
  
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs font-bold text-gray-500 hover:text-black uppercase tracking-wider transition-colors"
            >
              {isEditing ? "Close" : "Edit"}
            </button>
            <button 
              onClick={() => onDelete(section.id)}
              className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all opacity-0 group-hover:opacity-100"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
  
        {isEditing && (
          <div className="border-t border-gray-50 bg-gray-50/50 p-5 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Heading</label>
              <input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-black/5 outline-none shadow-sm"
                placeholder="e.g. Welcome to the event"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Body Content</label>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-black/5 outline-none shadow-sm min-h-[100px]"
                placeholder="Tell your guests about this section..."
              />
            </div>
            <button 
              onClick={handleUpdate}
              className="w-full bg-black text-white py-3 rounded-xl text-xs font-bold shadow-lg hover:shadow-none transition-all active:scale-[0.98]"
            >
              Update Section
            </button>
          </div>
        )}
      </div>
    );
  }
  

export default function SortableSectionList({ eventId, sections }) {
  const { reorderSections, deleteSection, updateSection } = useBuilderStore();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    const newItems = arrayMove(sections, oldIndex, newIndex);

    const payload = newItems.map((s, index) => ({
      id: s.id,
      position_order: index + 1,
    }));

    await reorderSections(eventId, payload);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col">
          {sections.map((section) => (
            <SortableItem 
              key={section.id} 
              section={section} 
              eventId={eventId}
              onDelete={(id) => deleteSection(eventId, id)}
              onUpdate={updateSection} // Calls the store directly with (eventId, sectionId, payload)
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}