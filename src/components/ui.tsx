'use client'

import { forwardRef, useLayoutEffect, useRef, useState, type ButtonHTMLAttributes, type ComponentProps, type ElementType, type HTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'
import Link from 'next/link'
import { useMenu } from './Menu'

/* Circo design system: the shared building blocks. Use these instead of styling text, buttons
   and fields per page. Tokens (colour, type, spacing, radius) live in tokens.css; styles in
   styles/ui.css. A live reference of everything is at /design. */

/* ---------- Text ---------- */

export type TextVariant = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'body-sm' | 'caption' | 'label'
export type Tone = 'primary' | 'secondary' | 'muted' | 'accent' | 'danger' | 'warning' | 'success'

// Sensible default element per variant; override with `as`.
const TAG: Record<TextVariant, ElementType> = { display: 'h1', h1: 'h1', h2: 'h2', h3: 'h3', body: 'p', 'body-sm': 'p', caption: 'p', label: 'span' }

export function Text({ variant = 'body', tone, as, className = '', ...rest }: HTMLAttributes<HTMLElement> & { variant?: TextVariant; tone?: Tone; as?: ElementType }) {
  const Tag = as ?? TAG[variant]
  return <Tag className={`t-${variant}${tone ? ` tone-${tone}` : ''} ${className}`.trim()} {...rest} />
}

/* ---------- Tag (pill on artwork) ---------- */

export function Tag({ tone = 'default', className = '', ...rest }: HTMLAttributes<HTMLSpanElement> & { tone?: 'default' | 'accent' | 'warning' }) {
  return <span className={`ui-tag${tone === 'default' ? '' : ` ui-tag--${tone}`} ${className}`.trim()} {...rest} />
}

/* ---------- Surface (panel / card) ---------- */

export function Surface({ level = 1, pad = 'md', className = '', ...rest }: HTMLAttributes<HTMLDivElement> & { level?: 1 | 2; pad?: 'none' | 'sm' | 'md' | 'lg' }) {
  return <div className={`ui-surface ui-surface--${level}${pad === 'none' ? '' : ` ui-surface--pad-${pad}`} ${className}`.trim()} {...rest} />
}

export function Divider({ className = '' }: { className?: string }) {
  return <hr className={`ui-divider ${className}`.trim()} />
}

/* ---------- Buttons and fields ---------- */

/* Three styles, three sizes. primary: white pill, the main action. secondary: translucent grey
   pill, for everything else (works on black and over artwork). link: underlined text.
   Sizes: sm 40px, md 48px, lg 56px. */
export type ButtonVariant = 'primary' | 'secondary' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg'
type ButtonLook = { variant?: ButtonVariant; size?: ButtonSize; icon?: ReactNode; block?: boolean }

export function buttonClass({ variant = 'primary', size = 'md', block }: ButtonLook, extra = '') {
  const base = variant === 'link' ? 'ui-btn--link' : `${variant === 'primary' ? 'btn-white' : 'btn-dark'}${size === 'md' ? '' : ` btn-${variant === 'primary' ? 'white' : 'dark'}--${size}`}`
  return `${base}${block ? ' ui-btn-block' : ''} ${extra}`.trim()
}

export function Button({ variant, size, icon, block, className = '', children, type = 'button', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & ButtonLook) {
  return (
    <button type={type} className={buttonClass({ variant, size, block }, className)} {...rest}>
      {icon}
      {children}
    </button>
  )
}

/* Same looks, as a link (navigation rather than an action). */
export function ButtonLink({ variant, size, icon, block, className = '', children, ...rest }: ComponentProps<typeof Link> & ButtonLook) {
  return (
    <Link className={buttonClass({ variant, size, block }, className)} {...rest}>
      {icon}
      {children}
    </Link>
  )
}

/* Field states. Default / focus / filled come from the input itself; the rest you set:
   status="checking" (spinner, e.g. username availability), "success" (green tick), and
   error="message" (red line and message). disabled dims the field. */
export type FieldStatus = 'checking' | 'success'
type FieldShell = { label?: string; hint?: ReactNode; error?: ReactNode; status?: FieldStatus; trailing?: ReactNode; className?: string }

function FieldTrail({ status, error }: { status?: FieldStatus; error?: ReactNode }) {
  if (status === 'checking') return <span className="spinner spinner--sm" role="status" aria-label="Checking" />
  if (status === 'success' && !error)
    return (
      <svg className="ui-field__ok" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-label="Looks good">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    )
  return null
}

/* The underline text field from onboarding: label above, line below, a hint or error under it. */
export const TextField = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & FieldShell>(function TextField(
  { label, hint, error, status, trailing, className = '', disabled, ...input },
  ref,
) {
  return (
    <label className={`ui-field${disabled ? ' is-disabled' : ''} ${className}`.trim()}>
      {label && <span className="ui-field__label">{label}</span>}
      <span className={`uline ui-field__line${error ? ' uline--error' : ''}${status === 'success' && !error ? ' is-success' : ''}`}>
        <input ref={ref} disabled={disabled} aria-invalid={!!error} {...input} />
        {trailing ?? <FieldTrail status={status} error={error} />}
      </span>
      {error ? <span className="ui-field__error">{error}</span> : hint ? <span className="ui-field__hint">{hint}</span> : null}
    </label>
  )
})

/* A choice list: the underline field as the trigger, opening Circo's own dropdown menu
   (the same one as ⋯ and Settings), never the browser's native list. */
export function SelectField({
  label,
  hint,
  error,
  className = '',
  options,
  value,
  placeholder = 'Select',
  onChange,
  autoOpen,
  disabled,
}: FieldShell & { options: { value: string; label: string }[]; value: string; placeholder?: string; onChange: (value: string) => void; autoOpen?: boolean; disabled?: boolean }) {
  const { open } = useMenu()
  const current = options.find((o) => o.value === value)
  const show = (el: HTMLElement) =>
    open(el, {
      label: label ?? placeholder,
      items: options.map((o) => ({ id: o.value, label: o.label, icon: o.value === value ? ('check' as const) : undefined, onSelect: () => onChange(o.value) })),
    })
  return (
    <div className={`ui-field${disabled ? ' is-disabled' : ''} ${className}`.trim()}>
      {label && <span className="ui-field__label">{label}</span>}
      <button
        type="button"
        disabled={disabled}
        className={`uline ui-field__line ui-field__line--select${error ? ' uline--error' : ''}`}
        aria-haspopup="menu"
        ref={(el) => {
          if (el && autoOpen && !el.dataset.opened) {
            el.dataset.opened = '1'
            requestAnimationFrame(() => show(el))
          }
        }}
        onClick={(e) => show(e.currentTarget)}
      >
        <span className={current ? '' : 'ui-field__placeholder'}>{current?.label ?? placeholder}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {error ? <span className="ui-field__error">{error}</span> : hint ? <span className="ui-field__hint">{hint}</span> : null}
    </div>
  )
}

/* ---------- Empty state ---------- */

/* Centred icon, one or two short lines, and an optional action. For lists with nothing in them. */
export function EmptyState({ icon, children, action, className = '' }: { icon: ReactNode; children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={`ui-empty ${className}`.trim()}>
      <span className="ui-empty__icon" aria-hidden>
        {icon}
      </span>
      <p className="ui-empty__text">{children}</p>
      {action}
    </div>
  )
}

/* ---------- Segmented control ---------- */

/* The one switcher: a frosted track with a pill that slides to the chosen option (as in the
   top bar's Shows / Series). Options can be buttons (onChange) or links (href). */
/* href navigates; onSelect is for a tab that opens something itself (a dropdown). */
export type Segment = { value: string; label: ReactNode; href?: string; onSelect?: (el: HTMLElement) => void }

export function SegmentedControl({ options, value, onChange, label, className = '' }: { options: Segment[]; value: string | null; onChange?: (value: string) => void; label: string; className?: string }) {
  const wrap = useRef<HTMLDivElement>(null)
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null)
  useLayoutEffect(() => {
    const measure = () => {
      const el = wrap.current?.querySelector<HTMLElement>('.seg__tab.is-active')
      setPill(el ? { x: el.offsetLeft, w: el.offsetWidth } : null)
    }
    measure()
    // Tabs change width when a label does (More becomes "Stand-up Comedy"), so watch them too.
    const ro = new ResizeObserver(measure)
    wrap.current?.querySelectorAll('.seg__tab').forEach((t) => ro.observe(t))
    window.addEventListener('resize', measure)
    document.fonts?.ready.then(measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [value])

  return (
    <div className={`seg ${className}`.trim()} ref={wrap} role="tablist" aria-label={label}>
      <span className="seg__pill" aria-hidden style={pill ? { transform: `translateX(${pill.x}px)`, width: pill.w, opacity: 1 } : { opacity: 0 }} />
      {options.map((o) => {
        const on = o.value === value
        const cls = `seg__tab${on ? ' is-active' : ''}`
        return o.href ? (
          <Link key={o.value} href={o.href} className={cls} role="tab" aria-selected={on}>
            {o.label}
          </Link>
        ) : (
          <button key={o.value} type="button" className={cls} role="tab" aria-selected={on} aria-haspopup={o.onSelect ? 'menu' : undefined} onClick={(e) => (o.onSelect ? o.onSelect(e.currentTarget) : onChange?.(o.value))}>
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

