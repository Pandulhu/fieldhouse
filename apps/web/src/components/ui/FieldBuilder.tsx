"use client"

import type { SignupFormField } from "@fieldhouse/types"

const fieldTypes = ["text", "email", "phone", "select", "checkbox"] as const
type FieldType = (typeof fieldTypes)[number]

interface FieldBuilderProps {
  fields: SignupFormField[]
  onAdd: () => void
  onRemove: (id: string) => void
  onUpdate: (id: string, updates: Partial<SignupFormField>) => void
}

export default function FieldBuilder({
  fields,
  onAdd,
  onRemove,
  onUpdate,
}: FieldBuilderProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-primary">Fields</span>
        <button
          onClick={onAdd}
          className="text-accent text-sm font-medium hover:underline"
        >
          + Add Field
        </button>
      </div>
      {fields.map((f) => (
        <div key={f.id} className="flex gap-2 mb-2 items-center">
          <input
            placeholder="Label"
            value={f.label}
            onChange={(e) => onUpdate(f.id, { label: e.target.value })}
            className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
          />
          <select
            value={f.type}
            onChange={(e) => onUpdate(f.id, { type: e.target.value as FieldType })}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            {fieldTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1 text-xs text-muted">
            <input
              type="checkbox"
              checked={f.required}
              onChange={(e) => onUpdate(f.id, { required: e.target.checked })}
            />
            Req
          </label>
          <button
            onClick={() => onRemove(f.id)}
            className="text-danger text-sm hover:underline"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  )
}
