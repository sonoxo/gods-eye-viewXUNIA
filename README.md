<div align="center">

# XUNIA GLASS ONION // GOD'S EYE VIEW

### Public-source spatial intelligence inside the XUNIA ecosystem

Photorealistic 3D Earth, public aviation and maritime signals, orbital data, earthquakes, traffic, public cameras, environmental context, and inspectable source provenance — organized as an experimental spatial-intelligence surface for XUNIA Glass Onion.

![Orbital HUD, tracked live globe, and sensor views](docs/media/hero-open-source-reveal.gif)

**[XUNIA Museum + HQ](https://sonoxo.github.io/gpt-doug-llm/) · [GPT-Doug-LLM](https://github.com/sonoxo/gpt-doug-llm) · [XuniaDAO](https://github.com/sonoxo/xuniadao) · [This Repository](https://github.com/sonoxo/gods-eye-viewXUNIA) · [Upstream Project](https://github.com/bilawalsidhu/gods-eye-view)**

</div>

---

## XUNIA status

**Classification:** Experimental / upstream-derived spatial-intelligence reference  
**XUNIA function:** Glass Onion geospatial visualization and public-source correlation research  
**Deployment posture:** Local-first browser application  
**Source posture:** Public, attributable, inspectable data only  
**Operational posture:** Defensive research, visualization, correlation, provenance, and human review

This repository is part of the **XUNIA experimental and research ecosystem**. It is not presented as a government system, classified capability, intelligence-agency service, or official product of any external vendor.

The underlying application began as the open-source **God's Eye View** project by Bilawal Sidhu. XUNIA preserves that upstream attribution and the repository's MIT license while using this fork as a research surface for **Glass Onion** architecture, public-source spatial analysis, provenance, and ecosystem integration.

---

## What Glass Onion means in XUNIA

Within GPT-Doug-LLM, **Glass Onion** is implemented as a defensive public-source correlation overlay. Its role is to combine separately sourced public evidence, create only source-grounded cross-links, verify lock state and provenance, and produce hash-sealed artifacts for review.

Glass Onion is explicitly bounded:

- no unauthorized scanning of external systems;
- no targeting or exploitation of third parties;
- no external authentication attempts;
- no automatic blocking or offensive replication;
- no modification of external systems;
- human review remains part of the evidence and publication process.

The spatial role of this repository is to provide a globe-centered interface where public signals can be visualized with their source, freshness, confidence, and modeled/live state kept distinguishable.

---

## XUNIA Glass Onion architecture

```text
PUBLIC DATA SOURCES
        │
        ▼
SOURCE ADAPTERS / NORMALIZATION
        │
        ▼
PROVENANCE + FRESHNESS LABELS
        │
        ▼
GOD'S EYE VIEW XUNIA
3D SPATIAL VISUALIZATION
        │
        ▼
GLASS ONION CORRELATION LAYER
source-grounded links only
        │
        ▼
GPT-DOUG / XUNIA ANALYSIS
        │
        ▼
EVIDENCE / LOCK / HUMAN REVIEW
        │
        ▼
XUNIA MUSEUM + HQ
```

The design goal is not to make public data look classified. The goal is to make complex open data **understandable, attributable, spatially coherent, and reviewable**.

---

## What this spatial surface can visualize

The upstream application provides a browser-based 3D globe and multiple public-data layers, including:

- **Live aircraft** — ADS-B derived public flight telemetry and route context.
- **Maritime vessels** — AIS-derived ship positions when configured.
- **Satellites** — orbital objects propagated from public orbital elements.
- **Earthquakes** — public seismic events.
- **Traffic** — live provider data when configured, with simulated states labeled when not live.
- **Public cameras** — cameras published through city or transportation APIs.
- **Environmental signals** — fires, weather-related context, and other public datasets supported by the application.
- **Infrastructure context** — public geospatial infrastructure datasets where licensing permits use.
- **3D map stacks** — photorealistic, aerial, and open map sources depending on configured providers.
- **Sensor-style visualization** — CRT, night-vision, thermal/FLIR-style, noir, and other rendering modes.
- **Scene annotation** — persistent marks, routes, boundaries, and measurements.
- **Shareable state** — camera position, layers, view modes, and tracked entities can be serialized into links.

A visual effect is not evidence. XUNIA treats the underlying **source and state labels** as more important than the cinematic presentation.

---

## Evidence-state model

Every Glass Onion integration should distinguish at least these states:

| State | Meaning |
|---|---|
| **LIVE** | Current data retrieved from an identified public source |
| **DELAYED** | Real source data with a known polling or publication delay |
| **RECONSTRUCTED** | A derived replay or estimate built from public observations |
| **MODELED** | A visualization or simulation, not a live observation |
| **PARTIAL** | Source coverage exists but is incomplete |
| **UNAVAILABLE** | The source cannot currently provide data |

XUNIA does not treat modeled or reconstructed output as verified live intelligence.

---

## XUNIA ecosystem connections

### GPT-Doug-LLM

**Repository:** https://github.com/sonoxo/gpt-doug-llm

GPT-Doug provides the broader XUNIA agent, evidence, governance, defensive-security, and Glass Onion research layers. Glass Onion's source-correlation implementation lives there and is designed around source validation, provenance-preserving links, lock verification, and bounded public-source analysis.

### XuniaDAO

**Repository:** https://github.com/sonoxo/xuniadao

XuniaDAO acts as the machine-readable ecosystem and ontology root for XUNIA repositories. This spatial project belongs in the geospatial / mission-systems research portion of that ecosystem.

### XUNIA Museum + HQ

**Public HQ:** https://sonoxo.github.io/gpt-doug-llm/

Museum + HQ is the public index for XUNIA repositories, experiments, evidence surfaces, and project provenance. It should be treated as the public front door, while this repository remains a technical implementation and research artifact.

---

## Quick start

### Requirements

The current application requires Node.js compatible with the repository's `package.json` engine constraint:

```text
>=24.14.0 <25 OR >=26 <27
```

### Install

```bash
cp .env.example .env
npm install
npm run dev -- --host localhost --port 4173
```

Then open:

```text
http://localhost:4173
```

A Google Maps API key is required for Google Photorealistic 3D Tiles. Other layers have their own provider requirements. Review `.env.example`, `DATA_SOURCES.md`, and `SECURITY.md` before enabling additional services.

Do not commit API keys, session tokens, secrets, or private credentials to this repository.

---

## Build and test

```bash
npm run build
npm test
```

Additional repository checks include:

```bash
npm run test:track
npm run qa:map-source-tray
```

The XUNIA fork should preserve upstream tests before introducing XUNIA-specific integration work.

---

## Glass Onion integration rules

Any XUNIA-specific extension added to this fork should follow these rules:

1. **Public-source first.** Every factual layer must identify its source.
2. **Preserve provenance.** Record source URL/provider, retrieval time, and transformation state where practical.
3. **Separate fact from inference.** Derived conclusions must not be displayed as raw observations.
4. **Label simulations.** Modeled, reconstructed, estimated, or synthetic layers must be visibly distinguishable from live data.
5. **No affiliation inflation.** A public API, fork, dataset, standard, or reference repository does not establish partnership or endorsement.
6. **No classified claims.** Do not imply access to classified, restricted, or non-public intelligence.
7. **No offensive automation.** Glass Onion is not an exploitation, targeting, intrusion, or autonomous blocking system.
8. **Human review.** High-impact conclusions and publication decisions remain reviewable by a person.
9. **Respect licenses and provider terms.** Code licensing does not override third-party data, model, imagery, or API terms.
10. **Keep evidence inspectable.** Prefer reproducible transforms, hashes, manifests, and linked source records over unverifiable assertions.

---

## Example Glass Onion workflow

```text
1. Acquire an identified public source
2. Validate source metadata
3. Normalize entities and coordinates
4. Attach timestamps / freshness state
5. Render the source spatially
6. Create source-grounded correlations
7. Separate observation from inference
8. Generate evidence artifacts
9. Hash / lock reviewable outputs where applicable
10. Publish only with provenance intact
```

This is a research and evidence workflow, not a surveillance authorization model.

---

## Data and provider boundaries

This application combines code with third-party datasets, map providers, public APIs, and 3D assets. Those components do **not** automatically inherit the repository's MIT license.

Examples called out by the repository's existing license notice include:

- TeleGeography submarine-cable data with separate non-commercial/share-alike terms;
- OpenStreetMap-derived infrastructure data under ODbL requirements;
- NASA FIRMS material with its own public-domain/citation posture;
- runtime providers such as Google Maps, OpenSky, adsb.lol, AISStream, CelesTrak, USGS, OSM/Overpass, and municipal APIs;
- third-party 3D models under their respective individual licenses.

Before commercial deployment or redistribution, review:

- [`LICENSE`](LICENSE)
- [`DATA_SOURCES.md`](DATA_SOURCES.md)
- [`SECURITY.md`](SECURITY.md)
- [`public/models/README.md`](public/models/README.md)

---

## Attribution and upstream

**Original upstream project:**  
https://github.com/bilawalsidhu/gods-eye-view

**XUNIA fork:**  
https://github.com/sonoxo/gods-eye-viewXUNIA

The source code remains subject to the repository's MIT license, which identifies **Bilawal Sidhu** as the 2026 copyright holder. XUNIA-specific documentation and future modifications do not erase upstream authorship, copyright notices, or third-party licensing obligations.

This fork should not be interpreted as endorsement, sponsorship, partnership, or affiliation by the upstream author, data providers, government agencies, Palantir, OpenAI, NASA, NSA, or any other external organization unless independently documented by that organization.

---

## XUNIA research identity

**XUNIA Glass Onion** is intended to make public-source evidence easier to inspect across layers:

```text
WHERE did this data come from?
WHEN was it observed or retrieved?
WHAT is directly supported?
WHAT is inferred or modeled?
HOW are two records connected?
CAN another reviewer reproduce the path?
```

That is the standard this repository should move toward as it evolves inside XUNIA.

---

<div align="center">

### XUNIA // GLASS ONION // SPATIAL INTELLIGENCE

**Public sources. Provenance preserved. Inference labeled. Human review retained.**

https://sonoxo.github.io/gpt-doug-llm/

</div>
