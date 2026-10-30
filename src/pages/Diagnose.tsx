import { useState } from 'react'
import { ChevronLeft, ChevronRight, Hammer, RotateCcw, ShieldAlert, Stethoscope, Store } from 'lucide-react'
import { SYMPTOMS, rankCauses, type Symptom } from '../lib/diagnose'
import { Badge, Button, Card, PageHeader, cx } from '../components/ui'
import { SegmentBar, solidColor } from '../components/gauges'

export default function Diagnose() {
  const [symptom, setSymptom] = useState<Symptom | null>(null)
  const [answers, setAnswers] = useState<number[]>([])

  const reset = () => {
    setSymptom(null)
    setAnswers([])
  }

  return (
    <>
      <PageHeader
        title="Diagnose"
        subtitle="Answer a few questions and get the likely causes, ranked, with a rough repair cost in NT$."
        action={symptom && <Button variant="ghost" onClick={reset}><RotateCcw size={16} /> Start over</Button>}
      />
      {!symptom && <SymptomPicker onPick={setSymptom} />}
      {symptom && answers.length < symptom.questions.length && (
        <QuestionStep
          symptom={symptom}
          step={answers.length}
          onAnswer={(i) => setAnswers((a) => [...a, i])}
          onBack={() => (answers.length ? setAnswers((a) => a.slice(0, -1)) : reset())}
        />
      )}
      {symptom && answers.length === symptom.questions.length && (
        <Results symptom={symptom} answers={answers} onBack={() => setAnswers((a) => a.slice(0, -1))} />
      )}
    </>
  )
}

function SymptomPicker({ onPick }: { onPick: (s: Symptom) => void }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SYMPTOMS.map((s) => (
          <button
            key={s.id}
            onClick={() => onPick(s)}
            className="panel group flex cursor-pointer flex-col items-start gap-2 rounded-2xl border border-line p-5 text-left transition-colors hover:border-accent/60"
          >
            <Stethoscope size={20} className="text-accent" />
            <div className="font-display text-lg font-bold uppercase tracking-wide">{s.title}</div>
            <div className="text-sm text-muted">{s.blurb}</div>
            <div className="mt-auto flex items-center gap-1 pt-2 text-xs font-semibold text-accent opacity-70 group-hover:opacity-100">
              {s.questions.length} questions <ChevronRight size={14} />
            </div>
          </button>
        ))}
      </div>
      <p className="mt-6 text-xs text-muted">
        MotoMate's diagnosis is a rule-based expert system written for small air-cooled motorcycles like the SYM Wild Wolf 150. It is a starting point, not a replacement for a mechanic.
      </p>
    </>
  )
}

function QuestionStep({ symptom, step, onAnswer, onBack }: { symptom: Symptom; step: number; onAnswer: (i: number) => void; onBack: () => void }) {
  const q = symptom.questions[step]
  return (
    <Card className="mx-auto max-w-2xl">
      <div className="mb-2 flex items-center justify-between text-xs text-muted">
        <span className="font-display text-sm font-semibold uppercase tracking-[0.14em]">{symptom.title}</span>
        <span className="num">Question {step + 1} of {symptom.questions.length}</span>
      </div>
      <SegmentBar value={(step + 1) / symptom.questions.length} segments={symptom.questions.length} color={solidColor('var(--color-accent)')} />
      <h2 className="mt-6 font-display text-2xl font-bold">{q.text}</h2>
      <div className="mt-5 flex flex-col gap-2.5">
        {q.options.map((o, i) => (
          <button
            key={o.label}
            onClick={() => onAnswer(i)}
            className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-line bg-[#0c0e11] px-4 py-3.5 text-left font-medium transition-colors hover:border-accent hover:text-accent"
          >
            {o.label}
            <ChevronRight size={16} className="shrink-0 text-muted" />
          </button>
        ))}
      </div>
      <button onClick={onBack} className="mt-5 inline-flex cursor-pointer items-center gap-1 text-sm text-muted hover:text-ink">
        <ChevronLeft size={16} /> Back
      </button>
    </Card>
  )
}

function Results({ symptom, answers, onBack }: { symptom: Symptom; answers: number[]; onBack: () => void }) {
  const ranked = rankCauses(symptom, answers).filter((c) => c.confidence > 0)
  const warnings = ranked.filter((c) => c.warning && c.confidence >= 15)
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 text-sm text-muted">
        Likely causes for <span className="font-semibold text-ink">{symptom.title.toLowerCase()}</span>, most likely first:
      </div>

      {warnings.map((w) => (
        <div key={w.id} className="mb-4 flex gap-3 rounded-xl border border-bad/40 bg-bad/10 p-4 text-sm">
          <ShieldAlert size={18} className="shrink-0 text-bad" />
          <span><span className="font-semibold text-bad">Safety: </span>{w.warning}</span>
        </div>
      ))}

      <div className="flex flex-col gap-3">
        {ranked.map((c, i) => (
          <Card key={c.id} className={cx(i === 0 && 'border-accent/50')}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className={cx('num flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold', i === 0 ? 'bg-accent text-black' : 'bg-surface-2 text-muted')}>{i + 1}</span>
                <h3 className="font-semibold">{c.title}</h3>
              </div>
              <div className="flex gap-2">
                {c.diy ? (
                  <Badge tone="good"><Hammer size={12} /> DIY</Badge>
                ) : (
                  <Badge tone="warn"><Store size={12} /> Shop</Badge>
                )}
                <Badge tone="accent">{c.cost}</Badge>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1"><SegmentBar value={c.confidence / 100} segments={25} color={solidColor(i === 0 ? 'var(--color-accent)' : 'var(--color-warn)')} /></div>
              <span className="num w-12 text-right text-sm font-semibold">{c.confidence}%</span>
            </div>
            <p className="mt-3 text-sm text-muted">{c.fix}</p>
          </Card>
        ))}
      </div>
      <button onClick={onBack} className="mt-5 inline-flex cursor-pointer items-center gap-1 text-sm text-muted hover:text-ink">
        <ChevronLeft size={16} /> Change last answer
      </button>
    </div>
  )
}
