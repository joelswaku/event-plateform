export default function SettingsTab({ form, updateField }) {
    return (
      <div className="space-y-4">
        <label className="flex gap-2 items-center">
          <input
            type="checkbox"
            checked={form.allow_rsvp || false}
            onChange={(e) =>
              updateField("allow_rsvp", e.target.checked)
            }
          />
          Allow RSVP
        </label>
  
        <label className="flex gap-2 items-center">
          <input
            type="checkbox"
            checked={form.allow_ticketing || false}
            onChange={(e) =>
              updateField("allow_ticketing", e.target.checked)
            }
          />
          Enable Tickets
        </label>
      </div>
    );
  }