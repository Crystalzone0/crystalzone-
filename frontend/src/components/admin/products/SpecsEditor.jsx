import { useId } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Button from '../../ui/Button.jsx';

let counter = 0;

/** A new specification row with a stable id (used as the React key). */
export const newSpec = (key = '', value = '') => {
  counter += 1;
  return { id: `spec-${Date.now()}-${counter}`, key, value };
};

const SUGGESTIONS = ['Material', 'Colour', 'Size', 'Weight', 'Plating', 'Length', 'Closure'];

export default function SpecsEditor({ specs, onChange, max = 20, error }) {
  const listId = useId();

  const update = (id, field, value) => onChange(specs.map((s) => (s.id === id ? { ...s, [field]: value } : s)));

  return (
    <div>
      <datalist id={listId}>
        {SUGGESTIONS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      {specs.length === 0 ? (
        <p className="text-sm text-charcoal/60">No specifications yet. Add details like material, colour or size.</p>
      ) : (
        <ul className="space-y-3">
          {specs.map((spec, i) => (
            <li key={spec.id} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
              <input
                list={listId}
                value={spec.key}
                onChange={(e) => update(spec.id, 'key', e.target.value)}
                maxLength={60}
                placeholder="Name (e.g. Material)"
                aria-label={`Specification ${i + 1} name`}
                className="input sm:w-2/5"
              />
              <input
                value={spec.value}
                onChange={(e) => update(spec.id, 'value', e.target.value)}
                maxLength={200}
                placeholder="Value (e.g. Gold-plated alloy)"
                aria-label={`Specification ${i + 1} value`}
                className="input flex-1"
              />
              <button
                type="button"
                onClick={() => onChange(specs.filter((s) => s.id !== spec.id))}
                aria-label={`Remove specification ${i + 1}`}
                className="rounded-full p-2.5 text-charcoal/50 transition hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 size={17} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}

      {specs.length < max && (
        <Button variant="outline" size="sm" icon={Plus} onClick={() => onChange([...specs, newSpec()])} className="mt-4">
          Add specification
        </Button>
      )}
    </div>
  );
}