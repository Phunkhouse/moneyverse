'use client'

import { useState } from 'react'
import { Brand, Mark } from '@/ui/brand/Brand.tsx'
import { formatDate, formatMoney } from '@/ui/format.ts'
import {
  Banner,
  Button,
  Card,
  EmptyState,
  Glyph,
  IconButton,
  Money,
  Pill,
  Row,
  RowList,
  Segmented,
  Select,
  Sheet,
  TextField,
} from '@/ui/kit/index.ts'
import { ClockIcon, ListIcon, PlanIcon } from '@/ui/kit/icons.tsx'
import { ThemeSwitch } from '../../(app)/_shell/ThemeSwitch.tsx'
import { ThemeToggle } from '../../(app)/_shell/ThemeToggle.tsx'
import styles from './KitGallery.module.scss'

// Invented sample values only (public repository).
const colours = [
  'bg',
  'surface',
  'surface-2',
  'line',
  'ink',
  'ink-2',
  'ink-3',
  'accent',
  'accent-soft',
  'pos',
  'neg',
  'neg-soft',
  'warn',
  'warn-soft',
  's1',
  's2',
  's3',
  's4',
]

const periods = [
  { value: 'month', label: 'Měsíc' },
  { value: 'quarter', label: 'Čtvrtletí' },
  { value: 'year', label: 'Rok' },
] as const

export function KitGallery() {
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month')
  const [busy, setBusy] = useState(false)
  const [sheet, setSheet] = useState(false)
  return (
    <main className={styles.page}>
      <div className={styles.head}>
        <Brand />
        <div className={styles.row}>
          <ThemeSwitch />
          <ThemeToggle />
        </div>
      </div>

      <section className={styles.section}>
        <h2>Značka</h2>
        <div className={styles.row}>
          <Mark size={48} />
          <Brand size={40} />
          <Brand size={28} fontSize="var(--fs-md)" />
        </div>
      </section>

      <section className={styles.section}>
        <h2>Barvy</h2>
        <div className={styles.swatches}>
          {colours.map((name) => (
            <div key={name}>
              <i style={{ background: `var(--${name})` }} />
              <code>--{name}</code>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2>Písmo a formáty</h2>
        <Card>
          <div className={styles.type}>
            <span className={styles.heroNum}>
              {formatMoney(124_356_050, 'CZK')}
            </span>
            <span style={{ fontSize: 'var(--fs-xl)', fontWeight: 700 }}>
              Titulek obrazovky
            </span>
            <span
              className="num"
              style={{ fontSize: 'var(--fs-lg)', fontWeight: 600 }}
            >
              {formatMoney(1_680_100, 'CZK')} · {formatMoney(-4_250, 'EUR')} ·{' '}
              {formatMoney(129_900, 'USD')}
            </span>
            <span>Text, názvy transakcí · Velký nákup</span>
            <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)' }}>
              Popisky a vedlejší text · {formatDate('2026-11-26')}
            </span>
            <span className={styles.label}>Štítky a osy</span>
          </div>
        </Card>
      </section>

      <section className={styles.section}>
        <h2>Tlačítka</h2>
        <div className={styles.grid}>
          <Card title="Varianty">
            <div className={styles.row}>
              <Button>Uložit</Button>
              <Button variant="ghost">Zrušit</Button>
              <Button variant="danger">Smazat</Button>
            </div>
          </Card>
          <Card title="Stavy">
            <div className={styles.row}>
              <Button disabled>Nedostupné</Button>
              <Button
                busy={busy}
                onClick={() => {
                  setBusy(true)
                  setTimeout(() => setBusy(false), 1500)
                }}
              >
                {busy ? 'Ukládám…' : 'Vyzkoušet načítání'}
              </Button>
              <Button size="large">Velké</Button>
            </div>
          </Card>
          <Card title="Ikonová tlačítka">
            <div className={styles.row}>
              <IconButton label="Všechny transakce">
                <ListIcon />
              </IconButton>
              <IconButton label="Historie">
                <ClockIcon />
              </IconButton>
              <IconButton label="Nedostupné" disabled>
                <ListIcon />
              </IconButton>
            </div>
          </Card>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Ovládání a štítky</h2>
        <div className={styles.grid}>
          <Card title="Přepínač">
            <div className={styles.stack}>
              <Segmented
                label="Období"
                options={periods}
                value={period}
                onChange={setPeriod}
              />
              <Segmented
                label="Období (nedostupné)"
                options={periods}
                value="year"
                onChange={() => {}}
                disabled
              />
            </div>
          </Card>
          <Card title="Štítky">
            <div className={styles.row}>
              <Pill>Neutrální</Pill>
              <Pill tone="accent">Připravujeme</Pill>
              <Pill tone="positive">+3,2 %</Pill>
              <Pill tone="warn">90 %</Pill>
              <Pill tone="negative">Překročeno</Pill>
            </div>
          </Card>
          <Card title="Textové pole">
            <div className={styles.stack}>
              <TextField label="Poznámka" placeholder="Např. oběd s kolegy" />
              <TextField
                label="Částka"
                inputMode="decimal"
                defaultValue="12,5,0"
                error="Zadejte částku jako 1 234,50."
              />
              <TextField
                label="Nedostupné"
                disabled
                defaultValue="Jen ke čtení"
                hint="Nápověda pod polem."
              />
            </div>
          </Card>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Seznamy, částky a panel</h2>
        <div className={styles.grid}>
          <Card title="Řádky">
            <RowList>
              <li>
                <Row
                  lead={<Glyph name="Potraviny" seed="a" />}
                  title="Potraviny"
                  meta="Běžný účet · 26. 11. 2026"
                  trail={<Money minor={-45_650} currency="CZK" tone="signed" />}
                />
              </li>
              <li>
                <Row
                  lead={<Glyph name="Mzda a odměny" seed="b" />}
                  title="Mzda a odměny"
                  meta="Příjem"
                  trail={
                    <Money
                      minor={4_250_000}
                      currency="CZK"
                      tone="signed"
                      signed
                    />
                  }
                />
              </li>
              <li>
                <Row
                  title="Účet v EUR"
                  meta="Odkaz na podrobnosti"
                  href="#"
                  trail={<Money minor={140_000} currency="EUR" />}
                  trailSub={
                    <>
                      ≈ <Money minor={3_420_900} currency="CZK" estimated />
                    </>
                  }
                />
              </li>
            </RowList>
          </Card>
          <Card title="Výběr a panel">
            <div className={styles.stack}>
              <Select
                label="Měna"
                defaultValue="EUR"
                options={[
                  { value: 'CZK', label: 'CZK' },
                  { value: 'EUR', label: 'EUR' },
                  { value: 'USD', label: 'USD' },
                ]}
              />
              <Select
                label="S chybou"
                error="Vyberte měnu."
                options={[{ value: '', label: '—' }]}
              />
              <Button variant="ghost" onClick={() => setSheet(true)}>
                Otevřít panel
              </Button>
            </div>
          </Card>
        </div>
        <Sheet
          open={sheet}
          onClose={() => setSheet(false)}
          title="Ukázkový panel"
        >
          <div className={styles.stack}>
            <TextField
              label="Název"
              data-autofocus
              placeholder="Fokus začíná tady"
            />
            <Button block onClick={() => setSheet(false)}>
              Hotovo
            </Button>
          </div>
        </Sheet>
      </section>

      <section className={styles.section}>
        <h2>Plochy a zprávy</h2>
        <div className={styles.grid}>
          <Card hero>
            <div className={styles.stack}>
              <span className={styles.heroLabel}>Čisté jmění</span>
              <span className={styles.heroNum}>
                {formatMoney(124_356_050, 'CZK')}
              </span>
            </div>
          </Card>
          <Card title="Karta s akcí" action={<a href="#">Vše</a>}>
            <p>Obsah karty. Odkaz vpravo nahoře vede na podrobnosti.</p>
          </Card>
          <Card>
            <EmptyState icon={<PlanIcon />} title="Prázdný stav">
              Krátké vysvětlení, co tu bude a jak to přidat.
            </EmptyState>
          </Card>
        </div>
        <Banner action={<Button variant="ghost">Zadat</Button>}>
          <b>Hodnoty investic za listopad</b> chybí u dvou účtů.
        </Banner>
        <Banner tone="warn">
          Kurz ČNB pro dnešek zatím není, použit poslední známý.
        </Banner>
        <Banner tone="error">Uložení se nepovedlo. Zkuste to znovu.</Banner>
      </section>
    </main>
  )
}
