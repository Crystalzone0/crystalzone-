import { useId, useState } from 'react';
import { X } from 'lucide-react';

/** Type a tag and press Enter or comma. Backspace on an empty box removes the last tag. */
export default function TagInput({ tags, onChange, max = 20, label = 'Tags', hint }) {
  const id = useId();
  const [text, setText] = useState('');

  const add = (raw) => {
    const parts = String(raw)
      .split(',')
      .map((s) => s.trim().toLowerCase().slice(0, 40))
      .filter(Boolean);
    if (parts.length === 0) {
      setText('');
      return;
    }
    const next = [...tags];
    for (const part of parts) {
      if (!next.includes(part) && next.length < max) next.push(part);
    }
    onChange(next);
    setText('');
  };

  const onKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault(); // Enter must not submit the product form
      add(text);
    } else if (event.key === 'Backspace' && !text && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-charcoal/15 bg-white p-2 focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/30">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-gold/15 py-1 pl-3 pr-1.5 text-xs text-ink">
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              aria-label={`Remove tag ${tag}`}
              className="rounded-full p-0.5 transition hover:bg-gold/30"
            >
              <X size={13} />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => add(text)}
          disabled={tags.length >= max}
          maxLength={40}
          placeholder={tags.length >= max ? `Maximum ${max} tags` : 'Add a tag'}
          className="min-w-[8rem] flex-1 bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-charcoal/40"
        />
      </div>
      {hint && <p className="mt-1.5 text-xs text-charcoal/60">{hint}</p>}
    </div>
  );
}