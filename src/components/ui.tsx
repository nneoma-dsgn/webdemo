'use client'

import { forwardRef, useEffect, useLayoutEffect, useRef, useState, type ButtonHTMLAttributes, type ComponentProps, type ElementType, type HTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'
import Link from 'next/link'
import { useMenu } from './Menu'
import { Icon } from './Icon'

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

export function Tag({ tone = 'default', className = '', ...rest }: HTMLAttributes<HTMLSpanElement> & { tone?: 'default' | 'accent' | 'warning' | 'light' }) {
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
export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg'
type ButtonLook = { variant?: ButtonVariant; size?: ButtonSize; icon?: ReactNode; block?: boolean }

const BTN = { primary: 'btn-white', secondary: 'btn-dark', accent: 'btn-accent' } as const

export function buttonClass({ variant = 'primary', size = 'md', block }: ButtonLook, extra = '') {
  const base = variant === 'link' ? 'ui-btn--link' : `${BTN[variant]}${size === 'md' ? '' : ` ${BTN[variant]}--${size}`}`
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
   status="checking" (spinner, e.g. checking a code), "success" (green tick), and
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

/* ---------- Disclosure ---------- */

/* A card that opens to show more: an icon, a title and a sub line. With children it shows a
   chevron and opens to them (controlled: `open`, `onToggle`); without, it's a plain card with
   an optional `trailing` element on the right, such as a tag. */
export function Disclosure({ leading, title, sub, trailing, open = false, onToggle, children }: { leading?: ReactNode; title: ReactNode; sub?: ReactNode; trailing?: ReactNode; open?: boolean; onToggle?: () => void; children?: ReactNode }) {
  const opens = children !== undefined
  const head = (
    <>
      {leading && <span className="ui-disclosure__lead">{leading}</span>}
      <span className="ui-disclosure__text">
        <strong>{title}</strong>
        {sub && <span>{sub}</span>}
      </span>
      {opens ? (
        <Icon name="chevron-down" size={22} className="ui-disclosure__chev" />
      ) : (
        trailing
      )}
    </>
  )
  return (
    <Surface level={2} pad="none" className={`ui-disclosure${open ? ' is-open' : ''}`}>
      {opens ? (
        <button className="ui-disclosure__head" aria-expanded={open} onClick={onToggle}>
          {head}
        </button>
      ) : (
        <div className="ui-disclosure__head">{head}</div>
      )}
      {opens && open && <div className="ui-disclosure__body">{children}</div>}
    </Surface>
  )
}

/* ---------- List ---------- */

/* Rows separated by hairlines, the one list style everywhere (account details, settings,
   links, muted studios). Two kinds of row:
     - Button row: `action` puts a button on the right (Edit, Unmute, any label).
     - Link row: `onClick` makes the whole row a link, with a chevron on the right.
   Either can have a small `label` above, a `leading` image and `sub` text under the title.
   A row with neither is plain text. Pass children instead of title to put something else on
   the line (an edit form). */
export function List({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`ui-list ${className}`.trim()} {...rest} />
}

type RowProps = { label?: ReactNode; title?: ReactNode; sub?: ReactNode; empty?: boolean; leading?: ReactNode; action?: { label: string; onClick: () => void }; onClick?: () => void; children?: ReactNode; className?: string }

export function ListRow({ label, title, sub, empty, leading, action, onClick, children, className = '' }: RowProps) {
  const line = (
    <span className="ui-row__line">
      {leading && <span className="ui-row__lead">{leading}</span>}
      {children ?? (
        <span className="ui-row__main">
          <span className={`ui-row__title${empty ? ' is-empty' : ''}`}>{title}</span>
          {sub && <span className="ui-row__sub">{sub}</span>}
        </span>
      )}
      {action && (
        <Button variant="secondary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
      {onClick && (
        <svg className="ui-row__chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M9 6l6 6-6 6" />
        </svg>
      )}
    </span>
  )
  const body = (
    <>
      {label && <span className="ui-row__label">{label}</span>}
      {line}
    </>
  )
  return onClick ? (
    <button type="button" className={`ui-row ui-row--link ${className}`.trim()} onClick={onClick}>
      {body}
    </button>
  ) : (
    <div className={`ui-row ${className}`.trim()}>{body}</div>
  )
}

/* ---------- Dialog ---------- */

/* A centred panel over a dimmed page: title, close ✕, then whatever the flow needs.
   Escape or a click on the backdrop closes it, unless busy (e.g. mid-payment). */
export function Dialog({ title, onClose, busy, children, className = '' }: { title: string; onClose: () => void; busy?: boolean; children: ReactNode; className?: string }) {
  const overlay = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)

  // Phones: iOS lays its keyboard over the page instead of resizing it, so measure how much of
  // the screen it covers (--keyboard) and lift the sheet above it.
  useEffect(() => {
    const vv = window.visualViewport
    const el = overlay.current
    if (!vv || !el) return
    const fit = () => el.style.setProperty('--keyboard', `${Math.max(0, window.innerHeight - vv.height - vv.offsetTop)}px`)
    fit()
    vv.addEventListener('resize', fit)
    vv.addEventListener('scroll', fit)
    return () => {
      vv.removeEventListener('resize', fit)
      vv.removeEventListener('scroll', fit)
    }
  }, [])

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    panel.current?.querySelector<HTMLElement>('input, button:not(.ui-dialog__close)')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      prev?.focus()
    }
  }, [busy, onClose])
  return (
    <div ref={overlay} className="ui-dialog" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div ref={panel} className={`ui-dialog__panel ${className}`.trim()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="ui-dialog__head">
          <Text variant="h3" as="h2">
            {title}
          </Text>
          <button className="ui-dialog__close" onClick={onClose} disabled={busy} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <path d="M18 6 6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
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

