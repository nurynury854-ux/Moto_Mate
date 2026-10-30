# Devpost submission — copy & paste

**Project name:** MotoMate

**Tagline (short description):** The pocket co-pilot for motorcycle riders in Taiwan — maintenance tracker, fuel log, live "should I ride today?" score and a bike problem diagnoser.

**Built with:** react, typescript, vite, tailwindcss, recharts, open-meteo, vercel, vitest

---

## Inspiration

I study informatics in Taiwan and I just bought my first real motorcycle, a **SYM Wild Wolf 150**. Within the first week I had a bunch of questions: When is the first oil change? How often should I lube the chain? Is my fuel economy normal? Is it going to rain on my way home? And what is that clicking noise?

Taiwan has over 14 million registered scooters and motorcycles — more than one for every two people — yet the information riders need is scattered across owner's manuals, forums, weather apps and government websites. I wanted one simple app that answers all of those questions for riders like me.

## What it does

MotoMate is a mobile-friendly web app with five tools:

- **Dashboard** – your bike, odometer, today's ride score, what maintenance is coming up and countdowns for Taiwan paperwork (compulsory insurance 強制險, fuel fee 燃料費, emission inspection 排氣定檢).
- **Garage** – a preset maintenance schedule for the Wild Wolf 150. Every item is tracked by **kilometers and time**, and turns amber/red as it gets due. You can log services with costs and add your own items.
- **Fuel log** – log fill-ups and MotoMate calculates real km/L using the full-tank method, cost per km and monthly spending, with charts.
- **Ride or Rain?** – pulls live weather and air-quality data for 12 Taiwan cities (or your GPS location) and turns it into a **0–100 ride score**. It explains *why* (rain chance, wind gusts, heat, AQI/PM2.5, UV…), finds the best 2-hour window to ride, and tells you what to bring — raincoat, mask, sunscreen.
- **Diagnose** – a rule-based expert system for 8 common problems (won't start, stalling, chain noise, brakes, battery, shifting…). Answer 2–3 questions and get ranked likely causes with a confidence %, DIY vs. shop, a rough repair cost in NT$ and safety warnings.

All data stays private in the browser — no sign-up needed. Judges can add `?demo` to the URL to load 4 months of sample data.

## How we built it

- **React + TypeScript + Vite** for the app and **Tailwind CSS** for a dark, dashboard-style UI designed mobile-first, since riders use their phones.
- **Open-Meteo** forecast and air-quality APIs for live hourly data — free and no API key, so the demo never breaks.
- The **ride score** is a transparent penalty model: start at 100 and subtract points for rain probability, rainfall, thunderstorms, gusts, heat/cold (feels-like temperature), AQI and UV.
- The **diagnosis engine** is a weighted rule system: each answer adds or removes weight from possible causes, and the result is normalized into confidence percentages.
- **Recharts** for the fuel charts, **localStorage** for persistence, **Vitest** unit tests for all the core logic, and **Vercel** for hosting.
- I used AI coding tools (Claude Code) to move fast, while I focused on the idea, the rider experience and the Taiwan-specific details.

## Challenges we ran into

- **Making the ride score feel right.** Early versions were either too harsh (every cloudy hour was "Better not") or too forgiving. I tuned the weights so a typical humid Taipei afternoon scores "Good" while a thunderstorm always drops below 40, and added the "Why this score" breakdown so users can trust it.
- **Service intervals by distance *and* time.** A bike that sits in the rain still needs a chain lube even with no kilometers, so every item tracks whichever limit comes first.
- **Fuel-economy math.** The first fill-up has no distance before it, so efficiency has to be calculated between consecutive full-tank fill-ups.
- **Mobile layout.** The 12-hour forecast strip was pushing the whole page sideways on phones; fixing CSS grid overflow taught me a lot about `minmax(0, 1fr)`.

## Accomplishments that we're proud of

- A complete, polished app that works with **no backend, no login and no API keys**.
- The ride score uses **real live data** and explains itself instead of being a black box.
- Taiwan-specific details — paperwork reminders, NT$ costs, Taiwan cities, local riding tips like raincoat + shoe covers (雨衣 + 鞋套).
- Unit-tested core logic and a responsive design that works on phones and desktops.

## What we learned

- How to turn messy real-world data (weather, air quality) into one simple, actionable number.
- Designing rule-based systems — sometimes a well-designed rule engine is more reliable than an AI chatbot.
- React state management with context + localStorage, data visualization with Recharts, and deploying with Vercel.
- A lot about my own motorcycle!

## What's next for MotoMate

- **Traditional Chinese (繁體中文) version** for local riders.
- **AI mechanic chat** and photo-based diagnosis (e.g. photo of a worn chain or tire).
- **Cloud sync and multiple bikes** with an account.
- **Ride tracking** with GPS to update the odometer automatically.
- **Nearby shops and gas stations** on a map, and push notifications for maintenance and paperwork deadlines.
- Presets for more popular Taiwan bikes (Kymco, Yamaha, Gogoro…).
