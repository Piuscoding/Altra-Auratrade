export function ToggleSwitch({ checked, onChange, disabled, id, label }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange?.(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-brand-cyan/40 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked
          ? "bg-brand-cyan border-brand-cyan"
          : "bg-brand-slate/60 border-brand-slate"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
      {label ? <span className="sr-only">{label}</span> : null}
    </button>
  )
}
