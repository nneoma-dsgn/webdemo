'use client'

import { useState } from 'react'
import { Button, Disclosure, Divider, EmptyState, List, ListRow, SegmentedControl, SelectField, Surface, Tag, Text, TextField, type TextVariant, type Tone } from '../components/ui'

/* Living reference for the Circo design system. Everything here is the real component. */

/* The fourteen core colours. Everything on screen should come from these. */
const COLOURS: { group: string; tokens: [string, string, string][] }[] = [
  { group: 'Background', tokens: [['--bg-primary', 'Page', 'The page'], ['--surface-1', 'Surface', 'Panels and cards'], ['--surface-wash', 'Wash surface', 'Frosted bars on sign-up'], ['--bg-light', 'Light', 'Primary buttons']] },
  { group: 'Text', tokens: [['--text-100', 'Primary', 'Headings, key text'], ['--text-200', 'Secondary', 'Body text'], ['--text-300', 'Muted', 'Meta, hints'], ['--text-400', 'Faint', 'Placeholders, fine print'], ['--text-on-light', 'On light', 'Text on white']] },
  { group: 'Brand and status', tokens: [['--accent', 'Accent', 'Brand, progress'], ['--danger', 'Danger', 'Errors'], ['--warning', 'Warning', 'Time running out'], ['--success', 'Success', 'Confirmed']] },
  { group: 'Lines', tokens: [['--stroke-strong', 'Line', 'Dividers, input lines']] },
]

const TYPE: { v: TextVariant; size: string; use: string }[] = [
  { v: 'display', size: '40–72', use: 'Hero and coming-soon titles' },
  { v: 'h1', size: '32', use: 'Page titles, big numbers' },
  { v: 'h2', size: '24', use: 'Section and panel titles' },
  { v: 'h3', size: '20', use: 'Shelf headings, card titles' },
  { v: 'body', size: '16', use: 'Reading text, row titles, inputs, buttons' },
  { v: 'body-sm', size: '14', use: 'Secondary text, small buttons' },
  { v: 'caption', size: '12', use: 'Meta lines, hints, tags' },
  { v: 'label', size: '12', use: 'Eyebrows in capitals' },
]

const TONES: Tone[] = ['primary', 'secondary', 'muted', 'accent', 'danger', 'warning', 'success']
const SPACE = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16]

export default function DesignSystem() {
  const [gender, setGender] = useState('')
  const [seg, setSeg] = useState('muted')
  const [disclosed, setDisclosed] = useState(false)
  return (
    <div className="page page--padded ds">
      <Text variant="h1">Design system</Text>
      <Text variant="body-sm" tone="muted" className="ds__intro">
        Tokens live in <code>styles/tokens.css</code>, components in <code>components/ui.tsx</code>. Use these instead of one-off styles.
      </Text>

      <Section title="Colour">
        {COLOURS.map((g) => (
          <div key={g.group} className="ds__group">
            <Text variant="label" tone="muted">
              {g.group}
            </Text>
            <div className="ds__swatches">
              {g.tokens.map(([t, label, use]) => (
                <div key={t} className="ds__swatch">
                  <span style={{ background: `var(${t})` }} />
                  <Text variant="body-sm">{label}</Text>
                  <Text variant="caption" tone="muted">
                    {use}
                  </Text>
                  <Text variant="caption" tone="muted" as="code">
                    {t}
                  </Text>
                </div>
              ))}
            </div>
          </div>
        ))}
      </Section>

      <Section title="Type">
        <div className="ds__type">
          {TYPE.map((r) => (
            <div key={r.v} className="ds__typerow">
              <div className="ds__typemeta">
                <Text variant="caption">{r.v}</Text>
                <Text variant="caption" tone="muted">
                  {r.size}px · {r.use}
                </Text>
              </div>
              <Text variant={r.v} as="div">
                {r.v === 'label' ? 'Coming 27 November' : 'King of Boys'}
              </Text>
            </div>
          ))}
        </div>
        <div className="ds__group">
          <Text variant="label" tone="muted">
            Tones
          </Text>
          <div className="ds__row">
            {TONES.map((t) => (
              <Text key={t} variant="body" tone={t} as="span">
                {t}
              </Text>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Buttons">
        <Text variant="body-sm" tone="muted">
          Four styles, three sizes. Primary for the one main action on a screen; secondary for everything else; accent for promoting Circo itself (Get the app); link for low-key actions like Cancel.
        </Text>
        {(['lg', 'md', 'sm'] as const).map((size) => (
          <div key={size} className="ds__row">
            <Text variant="caption" tone="muted" as="span" className="ds__rowlabel">
              {size} · {size === 'lg' ? 56 : size === 'md' ? 48 : 40}px
            </Text>
            <Button size={size}>Primary</Button>
            <Button size={size} variant="secondary">
              Secondary
            </Button>
            <Button size={size} variant="accent">
              Accent
            </Button>
            <Button size={size} disabled>
              Disabled
            </Button>
          </div>
        ))}
        <div className="ds__row">
          <Text variant="caption" tone="muted" as="span" className="ds__rowlabel">
            link
          </Text>
          <Button variant="link">Cancel</Button>
        </div>
        <div className="ds__row ds__row--art">
          <Button>Watch Now</Button>
          <Button variant="secondary">Secondary over artwork</Button>
        </div>
      </Section>

      <Section title="Fields">
        <div className="ds__fields">
          <TextField label="Default" placeholder="Promo code" />
          <TextField label="Filled" defaultValue="CIRCO25" />
          <TextField label="With a hint" defaultValue="CIRCO25" hint="Letters and numbers, as printed." />
          <TextField label="Checking" defaultValue="CIRCO25" status="checking" />
          <TextField label="Success" defaultValue="CIRCO25" status="success" hint="That code works." />
          <TextField label="Error" defaultValue="OLDCODE" error="That code has expired." />
          <TextField label="Disabled" defaultValue="CIRCO25" disabled />
          <SelectField
            label="Select"
            placeholder="Select your gender"
            value={gender}
            onChange={setGender}
            options={['Male', 'Female', 'Prefer not to say'].map((g) => ({ value: g, label: g }))}
          />
          <SelectField label="Select, disabled" placeholder="Select your gender" value="" onChange={() => {}} options={[]} disabled />
        </div>
        <Text variant="caption" tone="muted">
          Focus: click any field. The line brightens while you type.
        </Text>
      </Section>

      <Section title="Segmented control">
        <Text variant="body-sm" tone="muted">
          The one switcher. Used for Shows / Series and Muted / Blocked.
        </Text>
        <SegmentedControl label="Example" value={seg} onChange={setSeg} options={[{ value: 'muted', label: 'Muted' }, { value: 'blocked', label: 'Blocked' }]} />
      </Section>

      <Section title="List">
        <Text variant="body-sm" tone="muted">
          The one list. A button row has an action on the right (Edit, Unmute, any label); a link row opens something and shows a chevron. Either can have a label above, an image and sub text.
        </Text>
        <List>
          <ListRow label="Label" title="Value" action={{ label: 'Button', onClick: () => {} }} />
          <ListRow label="Label" title="Not set" empty action={{ label: 'Button', onClick: () => {} }} />
          <ListRow title="Link row" onClick={() => {}} />
          <ListRow title="Link row with sub text" sub="A short line about where it goes" onClick={() => {}} />
          <ListRow label="Label" title="Read-only value" />
        </List>
      </Section>

      <Section title="Disclosure">
        <Text variant="body-sm" tone="muted">
          A card that opens to show more (a device, an item with details and an action). Without content to open, it takes a trailing tag instead of the chevron.
        </Text>
        <div className="ds__stack">
          <Disclosure title="Card with a tag" sub="Doesn’t open" trailing={<Tag tone="light">This device</Tag>} />
          <Disclosure title="Card that opens" sub="Tap to show more" open={disclosed} onToggle={() => setDisclosed((o) => !o)}>
            <Text variant="body-sm" tone="muted">
              Details go here
            </Text>
            <Button variant="secondary" size="sm">
              Action
            </Button>
          </Disclosure>
        </div>
      </Section>

      <Section title="Thumbnail placeholder">
        <Text variant="body-sm" tone="muted">
          Shown automatically when a poster or still doesn’t load. The frame keeps its shape.
        </Text>
        <div className="ds-thumbs">
          <div className="poster__art img-fallback ds-thumb--portrait" />
          <div className="cw__media img-fallback ds-thumb--landscape" />
        </div>
      </Section>

      <Section title="Empty state">
        <Surface level={1} pad="none">
          <EmptyState
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5 6 9H2v6h4l5 4V5z" />
                <path d="M22 9l-6 6" />
                <path d="M16 9l6 6" />
              </svg>
            }
            action={<Button size="sm">Optional action</Button>}
          >
            You haven’t muted any studios.
            <br />
            You’ll see less from studios you mute.
          </EmptyState>
        </Surface>
      </Section>

      <Section title="Tags">
        <div className="ds__row">
          <Tag>3 days</Tag>
          <Tag tone="accent">Best value · Save 75%</Tag>
          <Tag tone="warning">Pass ends soon</Tag>
          <Tag tone="light">This device</Tag>
        </div>
      </Section>

      <Section title="Surfaces">
        <div className="ds__surfaces">
          <Surface level={1}>
            <Text variant="body">Surface 1</Text>
            <Text variant="caption" tone="muted">
              Panels on the page background (Account section)
            </Text>
          </Surface>
          <Surface level={2}>
            <Text variant="body">Surface 2</Text>
            <Text variant="caption" tone="muted">
              Cards and rows inside a panel
            </Text>
          </Surface>
        </div>
      </Section>

      <Section title="Spacing">
        <div className="ds__space">
          {SPACE.map((n) => (
            <div key={n} className="ds__spacerow">
              <Text variant="caption" tone="muted" as="code">
                --space-{n}
              </Text>
              <span style={{ width: `var(--space-${n})` }} />
              <Text variant="caption" tone="muted">
                {n * 4}px
              </Text>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="ds__section">
      <Text variant="h2">{title}</Text>
      <Divider />
      {children}
    </section>
  )
}
