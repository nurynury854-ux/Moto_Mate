/**
 * Rule-based diagnosis: every answer adds weight to possible causes,
 * and the result ranks causes by their share of the total weight.
 */
export interface Cause {
  title: string
  fix: string
  diy: boolean
  cost: string // rough NT$ range at a Taiwan scooter/moto shop
  base: number
  warning?: string
}

export interface Option {
  label: string
  weights: Record<string, number>
}

export interface Question {
  text: string
  options: Option[]
}

export interface Symptom {
  id: string
  title: string
  blurb: string
  questions: Question[]
  causes: Record<string, Cause>
}

export interface RankedCause extends Cause {
  id: string
  confidence: number // 0–100
}

export function rankCauses(symptom: Symptom, answers: number[]): RankedCause[] {
  const weights: Record<string, number> = {}
  for (const [id, c] of Object.entries(symptom.causes)) weights[id] = c.base
  answers.forEach((optIdx, qIdx) => {
    const opt = symptom.questions[qIdx]?.options[optIdx]
    if (!opt) return
    for (const [id, w] of Object.entries(opt.weights)) weights[id] = Math.max(0, (weights[id] ?? 0) + w)
  })
  const total = Object.values(weights).reduce((a, b) => a + b, 0) || 1
  return Object.entries(symptom.causes)
    .map(([id, c]) => ({ ...c, id, confidence: Math.round((weights[id] / total) * 100) }))
    .sort((a, b) => b.confidence - a.confidence)
}

export const SYMPTOMS: Symptom[] = [
  {
    id: 'no-start',
    title: "Won't start",
    blurb: 'Engine does not fire, or the starter does nothing.',
    questions: [
      {
        text: 'What happens when you press the starter button?',
        options: [
          { label: 'Nothing at all / just a click', weights: { battery: 5, kill: 3, sidestand: 2 } },
          { label: 'Engine cranks slowly', weights: { battery: 6, plug: 1 } },
          { label: 'Engine cranks normally but will not fire', weights: { fuel: 4, plug: 4, flood: 2 } },
        ],
      },
      {
        text: 'Is the kill switch on RUN, the bike in neutral (green N light) and the side stand up?',
        options: [
          { label: "Yes, I've checked all three", weights: { kill: -3, sidestand: -2 } },
          { label: 'Not sure', weights: { kill: 3, sidestand: 3 } },
        ],
      },
      {
        text: 'How much fuel is in the tank?',
        options: [
          { label: 'Plenty', weights: { fuel: -2 } },
          { label: 'Low / on reserve', weights: { fuel: 5 } },
          { label: 'Full, but the bike sat unused for weeks', weights: { fuel: 3, battery: 3 } },
        ],
      },
    ],
    causes: {
      battery: { title: 'Weak or dead battery', fix: 'Try the kick starter. Charge the battery or jump-start it; replace it if resting voltage is under 12.2 V.', diy: true, cost: 'NT$0 – 1,200', base: 2 },
      kill: { title: 'Kill switch set to OFF', fix: 'Flip the red engine-stop switch on the right handlebar to RUN.', diy: true, cost: 'Free', base: 1 },
      sidestand: { title: 'Side-stand / neutral safety cut-off', fix: 'Raise the side stand and shift to neutral, or pull the clutch in while starting.', diy: true, cost: 'Free', base: 1 },
      fuel: { title: 'No fuel reaching the engine', fix: 'Refuel. If the bike sat for weeks, old fuel may need draining. Check the fuel hose for kinks.', diy: true, cost: 'NT$100 – 800', base: 1 },
      plug: { title: 'Fouled or worn spark plug', fix: 'Remove the plug: if it is black and wet, clean or replace it (NGK CR7HSA type).', diy: true, cost: 'NT$100 – 300', base: 1 },
      flood: { title: 'Flooded engine', fix: 'Wait 10 minutes, then crank with the throttle held fully open to clear excess fuel.', diy: true, cost: 'Free', base: 0 },
    },
  },
  {
    id: 'stall',
    title: 'Stalls at idle',
    blurb: 'Dies at traffic lights or when you close the throttle.',
    questions: [
      {
        text: 'When does it stall?',
        options: [
          { label: 'Only when the engine is cold', weights: { idle: 2, choke: 4 } },
          { label: 'When warm, at traffic lights', weights: { idle: 4, air: 2, intake: 2 } },
          { label: 'Randomly, even while riding', weights: { fuel: 3, electric: 4 } },
        ],
      },
      {
        text: 'Does the idle RPM hunt up and down?',
        options: [
          { label: 'Yes, it surges', weights: { intake: 4, idle: 2 } },
          { label: 'No, it just drops and dies', weights: { idle: 3, air: 2 } },
        ],
      },
      {
        text: 'When was the air filter last cleaned?',
        options: [
          { label: 'Recently', weights: { air: -2 } },
          { label: 'Over 6,000 km ago / never', weights: { air: 5 } },
        ],
      },
    ],
    causes: {
      idle: { title: 'Idle speed set too low', fix: 'Adjust the idle screw to roughly 1,400–1,600 RPM, or have a shop set it.', diy: true, cost: 'NT$0 – 200', base: 2 },
      air: { title: 'Clogged air filter', fix: 'Clean or replace the air filter element.', diy: true, cost: 'NT$150 – 350', base: 1 },
      intake: { title: 'Vacuum or intake air leak', fix: 'Check intake boots and vacuum hoses for cracks; spray carb cleaner near joints and listen for RPM changes.', diy: false, cost: 'NT$200 – 800', base: 1 },
      choke: { title: 'Cold-start enrichment issue', fix: 'Let the bike warm up for 30–60 s; a shop can check the choke or fast-idle system.', diy: false, cost: 'NT$300 – 1,000', base: 1 },
      fuel: { title: 'Dirty fuel system', fix: 'Fuel system cleaning (injector or carburetor) and a fuel filter check.', diy: false, cost: 'NT$500 – 1,500', base: 1 },
      electric: { title: 'Loose electrical connection', fix: 'Check the battery terminals, ignition coil connector and kill switch wiring.', diy: false, cost: 'NT$200 – 1,000', base: 1, warning: 'Random stalls while riding are dangerous in traffic — get this checked soon.' },
    },
  },
  {
    id: 'chain-noise',
    title: 'Chain noise',
    blurb: 'Clunking, grinding or slapping from the rear.',
    questions: [
      {
        text: 'What does it sound like?',
        options: [
          { label: 'Dry grinding / squeaking', weights: { lube: 6 } },
          { label: 'Slapping or clunking over bumps', weights: { slack: 6 } },
          { label: 'Clicking once per wheel turn', weights: { sprocket: 4, link: 4 } },
        ],
      },
      {
        text: 'When did you last lube the chain?',
        options: [
          { label: 'Within 500 km', weights: { lube: -3 } },
          { label: 'Over 500 km ago or after riding in rain', weights: { lube: 5 } },
        ],
      },
      {
        text: 'Push the chain up and down at the middle. How far does it move?',
        options: [
          { label: 'About 2–3 cm', weights: { slack: -3 } },
          { label: 'More than 4 cm', weights: { slack: 6 } },
          { label: 'Very tight, under 1 cm', weights: { slack: 3 } },
        ],
      },
    ],
    causes: {
      lube: { title: 'Dry or dirty chain', fix: 'Clean with chain cleaner, then apply chain lube on the inside of the chain while warm.', diy: true, cost: 'NT$150 – 400', base: 2 },
      slack: { title: 'Incorrect chain slack', fix: 'Loosen the rear axle and adjust the chain to 20–30 mm of slack, keeping both sides aligned.', diy: true, cost: 'NT$0 – 200', base: 1 },
      sprocket: { title: 'Worn sprockets', fix: 'Check for hooked teeth. Replace the chain and sprockets together as a set.', diy: false, cost: 'NT$1,200 – 2,500', base: 1 },
      link: { title: 'Stiff or kinked chain link', fix: 'Rotate the wheel and find the link that does not straighten. Lube it; replace the chain if it stays stiff.', diy: true, cost: 'NT$0 – 900', base: 1 },
    },
  },
  {
    id: 'brakes',
    title: 'Brake squeal or weak brakes',
    blurb: 'Squealing, grinding, or the lever feels soft.',
    questions: [
      {
        text: 'What do you notice?',
        options: [
          { label: 'High-pitched squeal', weights: { glaze: 4, pads: 2 } },
          { label: 'Metal-on-metal grinding', weights: { pads: 7 } },
          { label: 'Soft or spongy lever that pulls far', weights: { fluid: 7 } },
        ],
      },
      {
        text: 'When were the pads last checked?',
        options: [
          { label: 'Within 3,000 km', weights: { pads: -2 } },
          { label: "Can't remember", weights: { pads: 4 } },
        ],
      },
    ],
    causes: {
      pads: { title: 'Brake pads worn out', fix: 'Replace the pads now. Grinding means metal backing plates are touching the disc.', diy: false, cost: 'NT$300 – 800 per axle', base: 2, warning: 'Worn brakes are a serious safety risk — stop riding and get them fixed now.' },
      glaze: { title: 'Glazed pads or dirty disc', fix: 'Clean the disc with brake cleaner and lightly sand the pad surface.', diy: true, cost: 'NT$100 – 300', base: 1 },
      fluid: { title: 'Air in lines or old brake fluid', fix: 'Bleed the brakes and replace the fluid with DOT 4.', diy: false, cost: 'NT$300 – 600', base: 1, warning: 'A spongy lever means reduced stopping power — have it checked before riding.' },
    },
  },
  {
    id: 'fuel-economy',
    title: 'Poor fuel economy',
    blurb: 'Using more fuel than usual (normal is ~35–45 km/L).',
    questions: [
      {
        text: 'How do you mostly ride?',
        options: [
          { label: 'Stop-and-go city traffic', weights: { riding: 4 } },
          { label: 'Steady roads / highway-speed roads', weights: { riding: -1, air: 1 } },
        ],
      },
      {
        text: 'When did you last check tire pressure?',
        options: [
          { label: 'This week', weights: { tires: -3 } },
          { label: 'Over a month ago', weights: { tires: 5 } },
        ],
      },
      {
        text: 'Any black smoke or a strong fuel smell?',
        options: [
          { label: 'Yes', weights: { rich: 6 } },
          { label: 'No', weights: { rich: -1 } },
        ],
      },
    ],
    causes: {
      tires: { title: 'Under-inflated tires', fix: 'Inflate to front 29 / rear 33 psi (check the sticker). Free air at most gas stations.', diy: true, cost: 'Free', base: 2 },
      riding: { title: 'Riding style or traffic', fix: 'Smooth throttle, shift up earlier and avoid hard acceleration from lights.', diy: true, cost: 'Free', base: 2 },
      air: { title: 'Dirty air filter', fix: 'Clean or replace the air filter.', diy: true, cost: 'NT$150 – 350', base: 1 },
      rich: { title: 'Running rich (too much fuel)', fix: 'A shop should check the fuel mixture, O2 sensor or carburetor jetting.', diy: false, cost: 'NT$500 – 2,000', base: 1 },
    },
  },
  {
    id: 'battery',
    title: 'Battery keeps dying',
    blurb: 'Needs jump starts or kick-starting repeatedly.',
    questions: [
      {
        text: 'How old is the battery?',
        options: [
          { label: 'Under 2 years', weights: { old: -3, charging: 2 } },
          { label: '2 years or more / unknown', weights: { old: 6 } },
        ],
      },
      {
        text: 'Do you have accessories (USB charger, phone holder lights, LED kit)?',
        options: [
          { label: 'Yes, wired in', weights: { drain: 6 } },
          { label: 'No', weights: { drain: -2 } },
        ],
      },
      {
        text: 'Do the lights dim a lot at idle or flicker?',
        options: [
          { label: 'Yes', weights: { charging: 5 } },
          { label: 'No', weights: {} },
        ],
      },
    ],
    causes: {
      old: { title: 'Battery near end of life', fix: 'Replace it with a YTX7A-BS type 12 V battery.', diy: true, cost: 'NT$800 – 1,500', base: 2 },
      drain: { title: 'Parasitic drain from accessories', fix: 'Wire USB chargers through an ignition-switched circuit, not directly to the battery.', diy: false, cost: 'NT$200 – 600', base: 1 },
      charging: { title: 'Charging system fault (regulator/stator)', fix: 'A shop should measure charging voltage at 5,000 RPM (it should be 13.5–14.5 V).', diy: false, cost: 'NT$800 – 3,000', base: 1 },
    },
  },
  {
    id: 'engine-noise',
    title: 'Strange engine noise',
    blurb: 'Ticking, knocking or rattling from the engine.',
    questions: [
      {
        text: 'What kind of sound?',
        options: [
          { label: 'Fast ticking from the top of the engine', weights: { valves: 6 } },
          { label: 'Deep knocking under load', weights: { oil: 4, knock: 4 } },
          { label: 'Rattle that goes away with RPM', weights: { camchain: 5 } },
        ],
      },
      {
        text: 'When was the last oil change?',
        options: [
          { label: 'Within 3,000 km', weights: { oil: -3 } },
          { label: 'Over 3,000 km ago / unsure', weights: { oil: 6 } },
        ],
      },
    ],
    causes: {
      oil: { title: 'Low or old engine oil', fix: 'Check the level on the dipstick now. Change the oil (≈1.0 L 10W-40).', diy: true, cost: 'NT$250 – 450', base: 2, warning: 'Riding with low oil can destroy the engine — check before your next ride.' },
      valves: { title: 'Valve clearance too loose', fix: 'A shop should adjust the valve clearances (a common job on air-cooled singles).', diy: false, cost: 'NT$300 – 800', base: 1 },
      camchain: { title: 'Cam chain tensioner worn', fix: 'Replace the cam chain tensioner; inspect the cam chain.', diy: false, cost: 'NT$600 – 1,800', base: 1 },
      knock: { title: 'Pinging from low-octane fuel or overheating', fix: 'Use 95 octane. Avoid lugging the engine in high gear at low RPM.', diy: true, cost: 'Free', base: 1 },
    },
  },
  {
    id: 'shifting',
    title: 'Rough or hard shifting',
    blurb: 'Gears are hard to engage, false neutrals or slipping.',
    questions: [
      {
        text: 'What happens?',
        options: [
          { label: 'Hard to find neutral / clunky shifts', weights: { cable: 5, oil: 2 } },
          { label: 'Engine revs but the bike does not speed up', weights: { clutch: 7 } },
          { label: 'Pops out of gear', weights: { gearbox: 6 } },
        ],
      },
      {
        text: 'How much free play does the clutch lever have at the tip?',
        options: [
          { label: 'About 10–20 mm', weights: { cable: -3 } },
          { label: 'Almost none', weights: { clutch: 4 } },
          { label: 'Lots, it feels loose', weights: { cable: 5 } },
        ],
      },
    ],
    causes: {
      cable: { title: 'Clutch cable needs adjusting', fix: 'Use the adjuster at the lever to set 10–20 mm of free play; lube the cable.', diy: true, cost: 'NT$0 – 300', base: 2 },
      oil: { title: 'Old engine oil', fix: 'Change the oil. Fresh oil makes shifting noticeably smoother.', diy: true, cost: 'NT$250 – 450', base: 1 },
      clutch: { title: 'Slipping clutch plates', fix: 'Replace the clutch friction plates and check the springs.', diy: false, cost: 'NT$1,200 – 2,500', base: 1 },
      gearbox: { title: 'Worn shift fork or gear dogs', fix: 'Needs a gearbox inspection at a shop.', diy: false, cost: 'NT$2,000 – 6,000', base: 1, warning: 'Popping out of gear can cause a loss of control — avoid hard acceleration until fixed.' },
    },
  },
]
