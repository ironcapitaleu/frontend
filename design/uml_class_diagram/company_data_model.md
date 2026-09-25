# Company Data Model

This note fixes the types behind the company page at `/companies/:symbol`
(Linear epic P-STA-10, ticket STA-222). STA-224 writes the port, the section
types and the claim types. STA-226 writes the metrics, the source collection
and the check evaluation. STA-227 fills the sample adapter with the Meridian
Semiconductor (MRDN) data. `DESIGN.md` §8 holds the page rules that this model
serves.

**Reading guide.** The note is long, so each ticket can read only its parts.

| Section                                   | What it fixes                                                      | Read it for      |
| ----------------------------------------- | ------------------------------------------------------------------ | ---------------- |
| [1. Terms](#1-terms)                      | The words the note uses                                            | every ticket     |
| [2. The port](#2-the-companygateway-port) | `CompanyGateway`, `Ticker`, the errors and the page states         | STA-224          |
| [3. Claims](#3-claims-periods-and-source-references) | `Claim`, `Period`, source references, `sourcesOf`, `feedsOf`, figure groups | every ticket |
| [4. Sections](#4-sections)                | The eight section types, the line keys, the kinds of line, the latest covered period, completed sections and what the port returns | STA-224, STA-227 |
| [5. Metrics and checks](#5-metrics-checks-and-results) | Figure references, market keys, per-row derived figures, guards, thresholds, check results | STA-226 |
| [6. The first check set](#6-the-first-check-set) | The 11 checks and the metrics they read                     | STA-226, STA-227 |
| [7. Worked examples](#7-worked-examples)  | S1, C1, V1, three loss-making cases, the weeks around a 10-K, a fiscal year end, the ownership copies and one Filings row, in the types | STA-224, STA-226, STA-227 |
| [8. Open questions](#8-open-questions-from-the-epic-fog-log) | The three fog questions from the epic, and three questions left to a ticket | every ticket |
| [9. Enforcement](#9-enforcement-levels)   | Which rules a script can check                                     | STA-224, STA-226 |

## 1. Terms

- A **port** is an interface that the app owns (`AGENTS.md` "Dependency
  Injection & Ports").
- A **section** is the data that one part of the page needs, such as the
  masthead or one tab.
- A **claim** is one figure on the page, with its value, its unit, its period
  and its source. A table cell, a chart point and a figure inside a check
  sentence are each one claim.
- A **period** is the stretch of time or the date that a claim covers, such as
  the fiscal year FY2026 or the quarter end 26 Jul 2026.
- A **source reference** (`SourceRef`) tells where a claim comes from. A
  reported source names one line in one document. A derived source gives a
  formula and the input claims.
- A **metric** is a defined figure with a name, a formula, a unit and its
  inputs.
- A **period selector** names the period of one metric input, such as "the
  latest fiscal year" or "five fiscal years before the latest". A **period
  window** names a run of periods, such as "the last 10 fiscal years".
- A **guard** is a condition on a metric input. If the guard fails, the metric
  has no reading, such as a P/E with negative earnings.
- A **check** is a rule over metrics with a visible threshold.

## 2. The `CompanyGateway` port

The port has one method per section. Each method takes a `Ticker` and returns
the section as a promise.

```mermaid
classDiagram
    class CompanyGateway {
        <<interface>>
        +getMasthead(ticker: Ticker) Promise~MastheadSection~
        +getOverview(ticker: Ticker) Promise~OverviewSection~
        +getFinancials(ticker: Ticker) Promise~FinancialsSection~
        +getValuation(ticker: Ticker) Promise~ValuationSection~
        +getShareholderReturns(ticker: Ticker) Promise~ShareholderReturnsSection~
        +getRelationships(ticker: Ticker) Promise~RelationshipsSection~
        +getManagement(ticker: Ticker) Promise~ManagementSection~
        +getFilings(ticker: Ticker) Promise~FilingsSection~
    }
    class Ticker {
        <<value object>>
        +value: string
        +parse(raw: string) Ticker$
        +isValid(raw: string) boolean$
        +equals(other: Ticker) boolean
        +toString() string
        +toJSON() string
    }
    class InvalidTicker {
        +reason: InvalidTickerReason
        +invalidInput: string
    }
    class CompanyFailure {
        <<abstract>>
        +name: string
        +message: string
    }
    class MissingCompany {
        +ticker: Ticker
    }
    class FailedCompanyRequest {
        +reason: Nullable~string~
    }
    Error <|-- InvalidTicker
    Error <|-- CompanyFailure
    CompanyFailure <|-- MissingCompany
    CompanyFailure <|-- FailedCompanyRequest
    Ticker ..> InvalidTicker : parse throws
    CompanyGateway ..> Ticker : takes
    CompanyGateway ..> CompanyFailure : rejects with
```

**`Ticker` is already on `dev`.** It lives in `src/lib/domain/ticker.ts` and
follows `AGENTS.md` "Value Objects", like `Email` in `src/lib/domain/email.ts`.
The diagram above copies its public shape. `Ticker.parse` trims and upper-cases
the input, and it is the only way to get a `Ticker`. On bad input it throws
`InvalidTicker` with one `InvalidTickerReason`: `empty`, `too-long`,
`invalid-character` or `invalid-separator`. The message has the form
`[InvalidTicker] Not a valid ticker, Reason: 'too-long', Input: 'ABCDEFGHIJK'`.
Code compares two tickers with `equals` and never with `===`. For example, the
Relationships tab matches a `Stake` with a company page only when
`stake.ticker` is not `null` and `stake.ticker.equals(pageTicker)` holds.

**Why one method per section.** Each tab loads only the sections that its
row in §4 names. A later milestone adds a method and leaves the existing
methods unchanged. A named fake can fail one section and serve the others,
so a test can draw a tab that fails while the masthead loads.

**How a method reports an error.** A method rejects its promise with a
`CompanyFailure`. It never returns a result object like `AuthOutcome`.
`AuthOutcome` fits a mutation, where a failure is an expected answer to the
user. A section read either returns the section or fails. `useCompany` catches
the rejection and maps it to a page state.

The messages follow `AGENTS.md` "Error Display Format". `CompanyFailure`
renders them the same way as `AuthFailure` in `src/lib/auth/errors.ts`: the
`, Reason: '<detail>'` tail appears only when `reason` holds a value. The
signature matches too. The constructor of `FailedCompanyRequest` takes
`reason?: string`, like `FailedAuthRequest`, so a caller writes
`new FailedCompanyRequest()` without a reason. The field `reason` then holds
`null`. `MissingCompany` has no reason. It names the ticker that the adapter
did not know in an `Input:` tail, as `InvalidTicker` does.

| Error                  | When                                        | Page state | Message                                                                                  |
| ---------------------- | ------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------- |
| `MissingCompany`       | The adapter knows no company for the ticker | missing    | `[MissingCompany] No company has this ticker, Input: 'XYZ'`                              |
| `FailedCompanyRequest` | The load did not complete, `reason` absent  | failed     | `[FailedCompanyRequest] The company request did not complete`                            |
| `FailedCompanyRequest` | The load did not complete, `reason` present | failed     | `[FailedCompanyRequest] The company request did not complete, Reason: 'Network timeout'` |

The description "did not complete" differs from the auth description on
purpose. The auth description uses a modal verb that the `plain-english` skill
replaces.

`getMasthead` decides the missing state, because every tab loads it. Two more
cases have a fixed state:

- If `getMasthead` resolves and a tab method rejects with `MissingCompany`,
  that tab shows the failed state. The masthead proved that the company
  exists, so the tab error is an adapter defect, not a missing company.
- `useCompany` keys each result by ticker and section. If a result arrives for
  a ticker that no longer `equals` the page's ticker, `useCompany` drops it.
  A slow `getOverview` for MRDN therefore never draws on the page of another
  company.

STA-224 writes the errors in `src/lib/company/errors.ts`, on the model of
`src/lib/auth/errors.ts`.

## 3. Claims, periods and source references

`Nullable~T~` means `T | null`, in the diagrams and in the tables. `Figure`
means `Claim | null`.
A `null` figure is a missing figure. The page draws it as a dimmed `—`
(`DESIGN.md` §8). A missing figure has no source, because nothing reported it.

```mermaid
classDiagram
    class Claim {
        +id: ClaimId
        +label: string
        +value: ClaimValue
        +unit: Unit
        +period: Nullable~Period~
        +source: SourceRef
    }
    class Period {
        +kind: PeriodKind
        +fiscalYear: number
        +fiscalQuarter: Nullable~number~
        +endsOn: IsoDate
    }
    class SourceRef {
        <<union>>
    }
    class ReportedSource {
        +kind: reported
        +document: SourceDocument
        +line: string
        +xbrlTag: Nullable~string~
        +url: string
    }
    class DerivedSource {
        +kind: derived
        +formula: string
        +inputs: Claim[]
    }
    class SourceDocument {
        <<union>>
    }
    class Filing {
        +kind: filing
        +form: FilingForm
        +filer: string
        +accessionNumber: string
        +filedOn: IsoDate
        +periodLabel: string
        +indexUrl: string
    }
    class MarketDataset {
        +kind: market
        +name: string
        +asOf: IsoDate
        +url: string
    }
    class SourceSet {
        +groups: SourceGroup[]
    }
    class SourceGroup {
        +document: SourceDocument
        +claims: Claim[]
    }
    Claim --> Period : period
    Claim --> SourceRef : source
    SourceRef <|-- ReportedSource
    SourceRef <|-- DerivedSource
    DerivedSource --> "1..*" Claim : inputs
    ReportedSource --> SourceDocument
    SourceDocument <|-- Filing
    SourceDocument <|-- MarketDataset
    SourceSet *-- SourceGroup
    SourceGroup --> SourceDocument
```

The value types:

- `ClaimValue` is `number | string`. A text claim, such as a subsidiary's
  jurisdiction or a board member's independence, uses the unit `text`.
- `Unit` is one of `usd`, `usdPerShare`, `shares`, `percent`, `ratio`,
  `count`, `year`, `date` or `text`. A `usd` or `shares` value is in whole
  units, not in thousands or millions, for example `212000000000` for
  $212.0B. A `usdPerShare` value keeps its cents, for example `5.51`. A
  `percent` value is a fraction, for example `0.15` for 15%. A `date` value
  is an `IsoDate`. The page formats it.
- `PeriodKind` is one of `fiscalYear` (FY2026), `fiscalQuarter` (Q2 FY2027,
  three months), `yearToDate` (six months to Q2 FY2027), `lastFourQuarters`
  or `instant` (a date, for a balance sheet or a price).
- `Period.fiscalYear` is the fiscal year that the period falls in.
  `Period.fiscalQuarter` is `1` to `4` for a quarter or a year to date. It is
  `null` for a fiscal year and for the last four quarters. `Period.endsOn` is
  the last day of the period, or the date of an instant.
- The end of a fourth quarter is also the end of a fiscal year, so the table
  that holds an instant decides its `fiscalQuarter`. In an annual table and
  in a series of fiscal year ends, an instant has `fiscalQuarter: null`. In a
  quarterly table, an instant has `fiscalQuarter` `1` to `4`, and the fourth
  quarter end has `4`. Each date therefore has one encoding in each table.
  For example, MRDN's FY2026 ends on 25 Jan 2026. The annual balance sheet
  holds that instant with `fiscalQuarter: null`, and the quarterly balance
  sheet holds it with `fiscalQuarter: 4`.
- `Claim.period` is `null` in two cases. A reported fact with no stated
  period, such as `Profile.website`, has no period. A derived claim whose
  inputs do not share one period has no period either. For example, the P/E
  now reads a price on 23 Sep 2026 and the EPS of FY2026, so its period is
  `null`. A derived claim whose inputs share one period by the rule below
  takes that period. For a fiscal year paired with the instant at its end, it
  takes the fiscal year. A derived quarter of §4 is the one exception. It
  takes the quarter of its column.
- Two periods are the **same period** when their `kind`, `fiscalYear`,
  `fiscalQuarter` and `endsOn` match. So the closes of 20 Feb and 20 Mar of
  one fiscal year are two periods, and so are two sums of the last four
  quarters that end on different dates. The one exception pairs a fiscal
  year with the instant at its end, because a year-end price and a year's
  EPS belong together. The two still need the same `endsOn`. The pair reads the annual encoding of the instant, with
  `fiscalQuarter: null`. §5 uses this rule to pair the inputs of a
  per-period metric.
- `ClaimId` is a string that is unique on the page. Hover, pin and chart
  highlight use it. Three owners mint ids, each under its own prefix:
  - The port mints `{section}.{key}.{period}`, such as
    `financials.revenue.FY2026`.
  - `metrics.ts` mints `metric.{key}.{period}`, such as
    `metric.freeCashFlow.FY2026`, or `metric.{key}` for a metric with no single
    period, such as `metric.priceToEarningsMedian10y`. It also derives points
    of statement lines: the fourth quarters and three-month figures of §4 and
    the sums over the last four quarters. For these, `{key}` is the
    `LineKey`, such as `metric.revenue.Q4-FY2026`. So one row of a completed
    quarterly table holds ids under two prefixes. No `MetricKey` equals a
    `LineKey`, so the two kinds of key never mint one id.
  - `checks.ts` mints `check.{checkId}.{part}`, such as `check.C1.count`.

  The `{period}` part renders the `Period` from its `kind`. The rendering
  keeps the annual, quarterly and last-four-quarters claims of one line apart:

  | `PeriodKind`       | `{period}`          | Example id                                  |
  | ------------------ | ------------------- | ------------------------------------------- |
  | `fiscalYear`       | `FY{fiscalYear}`    | `financials.revenue.FY2026`                 |
  | `fiscalQuarter`    | `Q{q}-FY{year}`     | `financials.revenue.Q2-FY2027`              |
  | `yearToDate`       | `YTD-Q{q}-FY{year}` | `financials.operatingCashFlow.YTD-Q2-FY2027` |
  | `lastFourQuarters` | `L4Q-{endsOn}`      | `metric.revenue.L4Q-2026-07-26`             |
  | `instant`, annual  | `{endsOn}`          | `financials.shareholdersEquity.2026-01-25`  |
  | `instant`, quarter | `Q{q}-{endsOn}`     | `financials.shareholdersEquity.Q4-2026-01-25` |

  An instant with `fiscalQuarter: null` renders as `{endsOn}`, and an instant
  with a quarter renders with the `Q{q}-` marker. So the annual column and
  the quarterly column at one fiscal year end get two ids.
  A claim with no period drops the part, such as `overview.profile.website`.
  A figure in a list row puts the list name and the row position before the
  field, such as `relationships.stakes.2.sharesHeld`. A row of
  `sectorBenchmarks` puts its `MetricKey` in place of the row position, such
  as `overview.sectorBenchmarks.operatingMargin.median`, so the id stays the
  same when the list changes order. A list whose rows are
  fiscal years, such as `ceoPay`, puts the period last instead, such as
  `management.ceoPay.salary.FY2026`. A claim from a named function of §5,
  derived or reported, uses the function name as its key, then the row part
  or the period, then a part name if the function gives several parts.
  Examples are
  `metric.stakePercent.stakes.2`, `metric.netInsiderShares.FY2026`,
  `metric.ownershipShares.overview.public` and `metric.priceChangeOneMonth`.
- `IsoDate` is a calendar date as a string, such as `2026-07-26`. STA-224
  brands the type, so a type test can tell it apart from a plain `string`.
- `FilingForm` is one of `10-K`, `10-Q`, `8-K`, `DEF 14A`, `Form 4` or
  `13F-HR`.

**A reported claim** has one `ReportedSource`. It holds the filing type
(`document.form`), the filing date (`document.filedOn`), the line label, the
XBRL tag and a link. `line` is the path to the line as the document prints it,
for example `Consolidated statements of income › Revenue`. A reported value
keeps the sign of its XBRL fact. For a payment line such as
`capitalExpenditure` or `dividendsPaid`, the XBRL fact is a positive amount,
so the value is positive.

**A reported claim without an XBRL tag** has `xbrlTag: null`. Some documents
report no XBRL fact for the figure. `DESIGN.md` §8 allows this case: the
source reference then names the line alone. Its `line` names the place in the
document, and its `url` opens the exact document inside the filing, not the
filing index:

| Document          | `line` example                                                        | `url` opens              |
| ----------------- | --------------------------------------------------------------------- | ------------------------ |
| 13F-HR            | `Information table › Shares (sshPrnamt)`                              | the information table    |
| Form 4            | `Table I › Amount beneficially owned following reported transactions` | the Form 4 document      |
| 10-K Exhibit 21   | `Exhibit 21 › Meridian Semiconductor GmbH › Jurisdiction`             | the Exhibit 21 document  |
| DEF 14A           | `Summary compensation table › Salary`                                 | the proxy statement      |
| End-of-day prices | `Closing price, NASDAQ`                                               | the price history        |

A price and a Treasury yield are reported claims too. Their document is a
`MarketDataset` instead of a `Filing`.

**A derived claim** has one `DerivedSource`. It holds the formula as text and
one input claim for each term of the formula. Each input is a claim with its
own source, so the sources form a small tree. Every branch ends in a reported
source. This example is the P/E now:

```mermaid
flowchart TD
    pe["P/E now = 38.2<br/>derived: price ÷ diluted EPS, FY2026"]
    price["Price = $210.60<br/>reported: NASDAQ close, 23 Sep 2026"]
    eps["Diluted EPS, FY2026 = $5.51<br/>reported: 10-K FY2026, filed 12 Mar 2026<br/>us-gaap:EarningsPerShareDiluted"]
    pe --> price
    pe --> eps
```

The tree has no cycle. `metrics.ts` builds each input claim before the claim
that reads it, so no claim can reach itself.

**How a chart or table collects its sources.** STA-226 writes these pure
functions in `src/lib/company/sources.ts`:

- `claimsOf(block: BlockKey, figures: "company" | "sector", sections:
  CompletedSections): Claim[]` returns the claims that a chart, table or check
  draws, of one kind. With `"sector"`, it returns the claims that the block
  reads from a `SectorBenchmark` field. With `"company"`, it returns every
  other claim of the block. So the two kinds never share a claim, and together
  they hold every claim that the block draws.
- `figureGroupsOf(tab, sections): FigureGroup[]` returns the groups of the
  charts, tables and checks of the tab. A block with no sector figures gives
  one group, with `figures: "company"`. A block that draws `SectorBenchmark`
  figures next to the company's figures gives two groups, one of each kind.
  The two share `block` and `label` and differ by `figures`. No block in
  `DESIGN.md` §8 draws sector figures alone. A `FigureGroup` pairs a
  `FigureGroupRef` (§4) with `claimsOf(ref.block, ref.figures, sections)`. The
  tab draws its blocks from the same groups, on screen or in print, so the
  list and the page cannot disagree. A block whose sections have not loaded
  gives no group.
- `isSectorBenchmark(ref: FigureGroupRef): boolean` reads `ref.figures`. It
  is true for a group of sector figures only, so no label decides it and a
  card title is free to change.
- `sourcesOf(claims: Claim[]): SourceSet` walks each tree down to its reported
  sources. It groups the reported claims by document, with one group per
  filing or dataset. It sorts filings newest first and puts market data last.
  It visits each `ClaimId` once, so a claim that two trees share appears once.
  The visited set also ends the walk if a defect ever builds a cycle.
- `feedsOf(groups: FigureGroup[]): Map<string, FigureGroupRef[]>` walks the same
  trees the other way. The map key is `Filing.accessionNumber`. It reads the tab
  and the label from each group and never from a claim. For each filing, it
  lists the groups that have at least one claim whose tree reaches that filing.
  Each group appears once for each filing, in the order of `groups`. A claim
  reaches a filing when a reported source in its tree has that filing as its
  `document`. An exhibit or an information table belongs to its filing, so its
  claims reach that filing too. A `MarketDataset` is not a filing, so it gets no
  entry.

The "Sources" chip of a chart or table shows `sourcesOf` over the claims of
the groups in `figureGroupsOf(tab, sections)` whose `block` is this block and
that `isSectorBenchmark` rejects. A block has one chip, where `DESIGN.md` §8
places it. So a block that draws sector figures next to the company's
figures shows the company's filings alone and names no peer filing. A reader
reaches the peers through a sector figure's own source card, which lists the
first ten inputs and counts the rest (§8).

The per-tab sources index reads the company's own groups, as the Filings walk
below does. It is `sourcesOf` over the claims of the groups of
`figureGroupsOf(tab, sections)` that `isSectorBenchmark` rejects, and `feedsOf`
over the same groups. A peer's filing is not a filing behind this company's
figures, so the index names none. A sector quartile still shows its peers on
its own source card (§8). No section stores a source
set or a list of what a filing feeds, so neither can disagree with the claims.
The printed page draws the blocks of the Overview tab and one block that the
screen hides, the Shareholder returns block of printed region 5
(`DESIGN.md` §8). That block has a `BlockKey` under the `overview` tab, so
`figureGroupsOf("overview", sections)` gives it a group like any other. The
sources footer is `sourcesOf` over the claims of those groups that
`isSectorBenchmark` rejects, as the per-tab index is. The printed page names
this company's filings alone. That group is the one group of a tab that the
screen does not draw. The Overview index and the Filings walk read it as
well, so its entry names the printed page rather than a card of the Overview
tab.

**The masthead gives no figure group.** `figureGroupsOf` takes a `TabKey`,
and `masthead` is not one. The masthead has no chart, no table and no check,
so it has no "Sources" chip either. Each masthead figure shows its own source
card. Every masthead figure is market data or a figure derived from market
data, so no masthead tree reaches a filing, and `feedsOf` loses nothing. A
later masthead figure that reads a filing first needs a figure group.

**The Filings tab loads every section.** Each row of "Filings We Read" shows
the figures that the filing feeds, over the whole page (`DESIGN.md` §8). So
the Filings tab calls `getFilings` and every other tab method that exists.
It then flattens the groups of the six other tabs into one list, in the tab
order of §4, and calls `feedsOf` once:

```ts
const otherTabs = tabKeys.filter((tab) => tab !== "filings")
const groups = otherTabs.flatMap((tab) => figureGroupsOf(tab, sections))
const feeds = feedsOf(groups.filter((group) => !isSectorBenchmark(group.ref)))
```

It draws its list as soon as `getFilings` resolves. Each row starts with the
groups of the sections that have loaded, and it grows as the other sections
load. A section that fails adds no groups, and the rows keep the groups they
have. Overview reads the Financials tables for "Ten Years at a Glance", so one
row can name the same figures twice, once under Overview and once under
Financials. Each entry names a place where the reader meets the figures, on
screen or on the printed page, so the row keeps both.

The Filings walk skips the sector benchmark groups. A sector quartile reads the
filings of the peers, never a filing of this company, so its trees reach no row
of the list. `figureGroupsOf` gives the sector figures their own group for this
reason. The first walk then costs one visit for each claim of the company's own
figures, a few thousand claims for ten years of three statements, and no peer
claim.

The note picks this over a static map in the repository, with a list of
`FigureGroupRef` for each `FilingForm`. A static map is hand-maintained, like
a stored index, and it drifts from the page. It also cannot tell two filings
of one form apart. A 10-K from FY2015 is outside the ten-year window and feeds
nothing, but a static map still lists the groups of every 10-K. The cost of
the choice is six more requests, and only when the user opens the Filings
tab. §7 works one row through.

A sector quartile has one input claim for each peer, so one tab can hold tens
of thousands of claims. `claimsOf`, `figureGroupsOf`, `sourcesOf` and
`feedsOf` are pure, so each tab memoises their results on the identity of its
completed sections (§4). `completeSections` runs once each time a section
loads, so that identity changes only when a section loads. A tab never
walks the trees again while its sections stay the same.

## 4. Sections

Each tab loads the masthead and the sections in its row.

| Page part           | Section type                | Port method             | `SectionKey`         | The tab also reads          |
| ------------------- | --------------------------- | ----------------------- | -------------------- | --------------------------- |
| Masthead            | `MastheadSection`           | `getMasthead`           | `masthead`           | none                        |
| Overview            | `OverviewSection`           | `getOverview`           | `overview`           | Financials, Valuation, Shareholder returns |
| Financials          | `FinancialsSection`         | `getFinancials`         | `financials`         | none                        |
| Valuation           | `ValuationSection`          | `getValuation`          | `valuation`          | Financials                  |
| Shareholder returns | `ShareholderReturnsSection` | `getShareholderReturns` | `shareholderReturns` | Financials                  |
| Relationships       | `RelationshipsSection`      | `getRelationships`      | `relationships`      | none                        |
| Management          | `ManagementSection`         | `getManagement`         | `management`         | none                        |
| Filings             | `FilingsSection`            | `getFilings`            | `filings`            | all six other tab sections  |

`SectionKey` is one of the eight keys in the table. `TabKey` is one of the
seven keys without `masthead`, in the order of the `DESIGN.md` §8 tab table.
`tabKeys` is the list of the seven `TabKey` values in that order.

The Overview tab reads Financials for "Ten Years at a Glance", the key figures
and the financial position. It reads Valuation for one check (V2) and for the
sector medians of three key figures: P/E, P/FCF and P/B. EV/EBIT is not a key
figure. While `getValuation` has not resolved, V2 shows "not enough data" and
the three medians show a dimmed `—`.

The Overview tab reads Shareholder returns because of the print summary
(`DESIGN.md` §8 "Print Summary"). The printed page holds a Shareholder returns
block with the dividend per share and the latest dividend declared, and only
`ShareholderReturnsSection` carries them. The screen shows no figure of that
section. While `getShareholderReturns` has not resolved, the printed block
shows a dimmed `—` for them.

```mermaid
classDiagram
    class MastheadSection {
        +ticker: Ticker
        +name: string
        +listings: Listing[]
        +sector: string
        +country: string
        +reportingCurrency: string
        +fiscalYearEnd: string
        +price: Figure
        +priceMonthEarlier: Figure
        +low52Weeks: Figure
        +high52Weeks: Figure
        +priceAtFiscalYearEnds: Series
    }
    class OverviewSection {
        +business: Figure
        +segments: RevenuePart[]
        +regions: RevenuePart[]
        +sectorBenchmarks: SectorBenchmark[]
        +ownership: OwnershipSummary
        +profile: Profile
    }
    class FinancialsSection {
        +income: Statement
        +balance: Statement
        +cashFlow: Statement
    }
    class Statement {
        +annual: StatementTable
        +quarterly: StatementTable
        +yearToDate: Nullable~StatementTable~
    }
    class StatementTable {
        +periods: Period[]
        +lines: StatementLine[]
    }
    class StatementLine {
        +key: LineKey
        +level: number
    }
    class Series {
        +key: string
        +label: string
        +unit: Unit
        +periods: Period[]
        +points: Figure[]
    }
    class ValuationSection {
        +treasuryYieldAtFiscalYearEnds: Series
        +treasuryYieldNow: Figure
        +sectorBenchmarks: SectorBenchmark[]
    }
    class SectorBenchmark {
        +metric: MetricKey
        +peerGroup: string
        +peerCount: number
        +lowerQuartile: Figure
        +median: Figure
        +upperQuartile: Figure
    }
    class ShareholderReturnsSection {
        +dividendPerShare: Series
        +latestDividendDeclared: Figure
        +sharesRepurchased: Series
        +sharesIssuedToStaff: Series
    }
    class RelationshipsSection {
        +ownership: OwnershipSummary
        +funds: FundHolding[]
        +insiders: InsiderHolding[]
        +subsidiaries: Subsidiary[]
        +stakes: Stake[]
    }
    class ManagementSection {
        +people: Person[]
        +ceoPay: PayYear[]
        +insiders: InsiderHolding[]
        +insiderSharesBought: Series
        +insiderSharesSold: Series
    }
    class FilingsSection {
        +filings: Filing[]
    }
    FinancialsSection *-- Statement
    Statement *-- StatementTable
    StatementTable *-- StatementLine
    Series <|-- StatementLine
    OverviewSection *-- SectorBenchmark
    ValuationSection *-- SectorBenchmark
```

**Series and statement lines.** `Series.points[i]` is the figure for
`Series.periods[i]`. A `StatementLine` is a `Series`, so it also has `key`,
`label`, `unit`, `periods` and `points`. Its own fields add the `LineKey` and
the indent `level`. Every line of a table has the same `periods` as the table.
`LineKey` names each reported line. Each key belongs to one statement, and
the adapter puts the line only in that statement's tables:

| Statement                  | `LineKey` values                                                                                                           |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Income (`income`)          | `revenue`, `operatingIncome`, `netIncome`, `dilutedEps`, `dilutedShares`                                                   |
| Balance sheet (`balance`)  | `totalCurrentAssets`, `totalAssets`, `totalCurrentLiabilities`, `totalLiabilities`, `shareholdersEquity`, `cashAndShortTermInvestments`, `shortTermDebt`, `longTermDebt` |
| Cash flow (`cashFlow`)     | `operatingCashFlow`, `capitalExpenditure`, `dividendsPaid`, `shareRepurchases`, `shareIssuanceProceeds`, `shareBasedCompensation` |

These keys cover every statement figure that `DESIGN.md` §8 names for the
Overview, Valuation and Shareholder returns tabs, the Financials chart and the
print summary. `operatingIncome` feeds the operating margin and EV/EBIT.
`totalAssets` and `totalLiabilities` give the long-term parts of Financial
Position, as the total minus the current part. The point metrics
`longTermAssets` and `longTermLiabilities` compute them at the latest
quarter end. `shareRepurchases` and
`shareIssuanceProceeds` give the net buybacks in dollars. The Financials
statement table draws more lines than these, such as gross profit. The
Financials Tab ticket adds their keys to this table. §5 says which table of the
statement each period choice reads.

**A label or a figure.** A `string` field is a label. It names the row or
places the company, and it carries no source. A `Figure` is a fact that a
document reports about the company or about the row, with its source. The
rule splits the fields this way:

- Labels: the masthead name, listings, sector, country, currency and fiscal
  year end. Also the name of each row: a segment, region, fund, insider,
  person, subsidiary or stake company. A person's or an insider's role is a
  label too, because it names the row.
- Row keys: `PayYear.fiscalYear`, `Person.isDirector`,
  `SectorBenchmark.peerCount`, `StatementLine.level` and
  `OwnershipSummary.asOf` describe the row itself. They carry no source,
  because the figures of the row carry the sources. `level` is the indent of
  a line in the printed statement. `asOf` is the quarter end that the 13F
  totals of the summary cover. Each total carries that date again as its
  `period`, with its source, and the adapter sets `asOf` from
  `institutionShares.period.endsOn`.
- Column keys: the fields of a `Period` in `periods`. A `Period` places the
  figures of a series, as a row key places the figures of a row.
- Source documents: the fields of a `Filing` in `FilingsSection.filings`. A
  filing is the source that the claims point to, so it has no source itself.
- Figures: every other number, every other date, and each text fact such as
  a subsidiary's jurisdiction or a board member's independence.

Every figure is a `Figure`, so every figure carries a `SourceRef`. The smaller
types:

| Type               | Fields                                                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| `Listing`          | `exchange: string`, `symbol: string`                                                                       |
| `RevenuePart`      | `name: string`, `revenue: Figure`                                                                          |
| `OwnershipSummary` | `asOf: IsoDate`, `sharesOutstanding: Figure`, `institutionShares: Figure`, `insiderShares: Figure`         |
| `Profile`          | `founded`, `headquarters`, `employees`, `chiefExecutive`, `chiefExecutiveSince`, `auditor`, `website`, each a `Figure` |
| `FundHolding`      | `fund: string`, `shares: Figure`, `sharesQuarterEarlier: Figure`                                           |
| `InsiderHolding`   | `name: string`, `role: string`, `shares: Figure`                                                           |
| `Subsidiary`       | `name: string`, `jurisdiction: Figure`                                                                     |
| `Stake`            | `company: string`, `ticker: Nullable~Ticker~`, `sharesHeld: Figure`, `sharesOutstanding: Figure`           |
| `Person`           | `name: string`, `role: string`, `isDirector: boolean`, `since: Figure`, `independence: Figure`            |
| `PayYear`          | `fiscalYear: number`, `salary`, `bonus`, `stockAwards`, `other`, each a `Figure`                           |
| `FigureGroupRef`   | `tab: TabKey`, `block: BlockKey`, `label: string`, `figures: FigureKind`, for example Financials, `incomeTable`, "Income statement table", company |
| `FigureGroup`      | `ref: FigureGroupRef`, `claims: Claim[]`, built by `figureGroupsOf` (§3), never stored in a section        |

`BlockKey` names one chart, table or check card of a tab, such as
`incomeTable` or `peRange`. It is a code key, so a card title is free to
change. `label` is display copy only, and no function reads it to decide.
`FigureKind` is `"company" | "sector"`.

STA-232 declares the blocks of the Overview and Financials tabs. Each later
tab ticket adds its own keys, such as `peRange` and `ceoPay`.

| Tab        | `BlockKey` values |
| ---------- | ----------------- |
| Overview   | `business`, `tenYears`, `keyFigures`, `financialPosition`, `checksByArea`, `ownership`, `profile`, and the print-only `printedShareholderReturns` |
| Financials | `incomeChart`, `incomeTable`, `balanceChart`, `balanceTable`, `cashFlowChart`, `cashFlowTable` |
| Valuation  | `valuationRatios`, `yieldsAgainstTreasury` (each yield, or the inputs of a missing one), `ratioFormulas` |
| Shareholder returns | `dividendPerShare`, so far |
| Relationships | `largestFunds`, `insiders`, `ownershipSplit`, `subsidiaries`, `stakes` |
| Management | `executivesAndBoard`, `payMix`, `insiderHoldings`, so far |

A chart reads the annual table of its statement. A table reads the annual
table and the completed quarterly table, because the annual and quarterly
switch shows both. The switch does not flip the chart. A chart reads only the
lines it draws, as `chartLines` in `sources.ts` lists them. The
`printedShareholderReturns` block reads the latest point of `dividendPerShare` and `latestDividendDeclared` from
`ShareholderReturnsSection`, and gives no group until that section loads.
The company figures of `keyFigures` are the eight claims of `keyFigureOf`, the
figures card 1.3 draws. Its sector figures are the medians of the benchmark
rows, and `sectorMedianOf` picks one for the card. `checksByArea` reads no
claim until the checks land.

**Share counts for buybacks.** `ShareholderReturnsSection.sharesRepurchased`
and `sharesIssuedToStaff` hold the shares bought back and the shares issued
under staff plans in each fiscal year. Each point is a reported claim from the
statement of shareholders' equity in the 10-K of that year. They feed
Shareholder returns card 2, "Buybacks Net of Shares Issued to Staff". They
are series and not statement lines, because the three statements of §4 do not
hold them.

**The share count of a stake.** `Stake.sharesHeld` comes from the company's
own 13F information table. The 13F does not report the shares outstanding of
the target company. So `Stake.sharesOutstanding` is a reported claim from the
target company's latest 10-Q or 10-K, with the cover-page tag
`dei:EntityCommonStockSharesOutstanding`. Its `document` is a `Filing` whose
`filer` is the target company. `sourcesOf` groups it under that filing.
`FilingsSection` lists every filing that a company figure cites, so it lists
this 10-K too, as it lists the Form 4s of the insiders and the 13F-HRs of the
funds. The row names its `filer`, and the Relationships sources index does
too, so the reader sees that another company filed it. The peer 10-Ks behind
a sector benchmark are the one exception: the Filings walk skips the sector
figures, so `FilingsSection` does not list them.

`FilingsSection` lists plain `Filing` values, newest first. Filings from one
day go by accession number, highest first. The Filings tab gets "what this
filing feeds" from `feedsOf` (§3), not from the port.

**Sector benchmarks in two sections.** `OverviewSection` and
`ValuationSection` both carry `SectorBenchmark` values, because the Overview
tab ships before `getValuation`. The two lists are disjoint by `metric`:

| Section            | `SectorBenchmark.metric` values                                                   | Read by                                   |
| ------------------ | --------------------------------------------------------------------------------- | ----------------------------------------- |
| `ValuationSection` | `priceToEarnings`, `priceToFreeCashFlow`, `priceToBook`, `enterpriseValueToEbit`  | Valuation card 1, Overview Key Figures (the first three) |
| `OverviewSection`  | `operatingMargin`, `returnOnEquity`, `dividendYield`, `buybackYield`              | Overview Key Figures                      |

The Valuation tab needs the quartiles of its four ratios, and the table above
gives it no `OverviewSection`. So the four ratios sit in `ValuationSection`, and
Overview reads three of them from there. A `MetricKey` in both lists is an
adapter defect. If one appears twice, the page reads the Valuation entry.

**One value in two sections.** `OwnershipSummary` sits on `OverviewSection`
and on `RelationshipsSection`. `InsiderHolding[]` sits on
`RelationshipsSection` and on `ManagementSection`. Each tab draws the whole
value and reads no other section (the table at the top of §4), so each
section carries its own copy. The benchmark split does not fit here, because
no part of the value belongs to one tab only. The copies hold the same
figures, from the same filings, with the same `asOf`, and the rows of each
`InsiderHolding[]` copy come in the same order. Each tab reads the copy
of its own section, and the print summary reads the Overview copy. A
difference between two copies is an adapter defect. A test in STA-227
compares the two copies of the sample adapter field by field, and ignores the
section prefix of the claim ids only.

**The annual and quarterly tables.** The three statements each hold an annual
table of ten fiscal years and a quarterly table of the last eight fiscal
quarters. A 10-Q reports no fourth quarter, and a cash flow statement in a
10-Q reports a year to date. So the port returns part of each quarterly table,
and `metrics.ts` completes it:

- The port returns every one of the eight quarters in `quarterly.periods`.
- At a position that no filing reports, the port returns a `null` point. For
  the income statement, this is each fourth quarter. For the cash flow
  statement, this is each second, third and fourth quarter. A 10-K reports the
  balance sheet at the fourth quarter end, so the balance sheet has no `null`
  point of this kind.
- The income statement and the cash flow statement also have a `yearToDate`
  table with the reported six-month and nine-month figures. The balance sheet
  has `yearToDate: null`. The `yearToDate` table holds the six-month and
  nine-month figures of each fiscal year that has a quarter in the quarterly
  window. When it has the nine-month figure, Q4 is the fiscal year minus the
  nine months, for both statements. Otherwise Q4 is the fiscal year minus the
  reported Q1, Q2 and Q3. For MRDN on 23 Sep 2026 the window starts at Q3
  FY2025, so Q4 FY2025 needs the nine months to Q3 FY2025.
- `metrics.ts` returns a new, complete `StatementTable` from
  `completeQuarters(statement)`. It never writes to a section. Every section
  that the port returns stays unchanged.

**Latest means latest covered.** A table's window ends at the latest period
that a filing covers, not at the latest period that has elapsed. A filing
covers a period when it reports that period, or when `completeQuarters`
derives the period from a figure that the filing reports. The annual table's
latest fiscal year is the latest one with a 10-K. The quarterly table's
latest quarter is the quarter end of the latest 10-Q, or the fourth quarter
once the 10-K is filed. The three statements share that one quarterly
window. So a cash flow quarter that `metrics.ts` derives from a year-to-date
figure is inside the window, as is a fourth quarter that it derives from the
10-K. The market series read the same annual window as the tables. A
year-end price or yield for a fiscal year with no 10-K is outside it, so V1
pairs each price with the earnings of the same year. The adapter reads which
filings exist from `FilingsSection.filings`. `fiscalYear(0)`,
`latestQuarter`, `lastFourQuarters` and `lastFiscalYears` all read from that
window. So in the weeks between a fiscal year end and its 10-K,
`fiscalYear(0)` is still the year before, and the checks read the same
figures as the week before. A `null` point above is a position inside the
window that no filing reports. It is never a whole period that no filing
covers yet, and a port that returns one is an adapter defect. §7 works the
case at 20 Feb 2026.

**Only a flow line has a derived quarter.** A subtraction or a sum of
quarters is correct only for a figure that adds up over a fiscal year. The
statement lines fall into four kinds:

| Kind                   | Lines                                                    | Derived fourth quarter | Sum over the last four quarters |
| ---------------------- | -------------------------------------------------------- | ---------------------- | ------------------------------- |
| Flow                   | `revenue`, `operatingIncome`, `netIncome`, every cash flow line | yes              | yes                             |
| Share count, averaged  | `dilutedShares`                                          | no, stays `null`       | no                              |
| Per-share figure       | `dilutedEps`                                             | no, stays `null`       | no                              |
| Stock, at an instant   | every balance sheet line                                 | no, the 10-K reports it | no                             |

`dilutedShares` is a weighted average over its period and `dilutedEps` is a
ratio, so neither adds up. `completeQuarters` derives the missing points of
the flow lines only. The fourth quarter of `dilutedShares` and `dilutedEps`
stays `null`, and the quarterly chart draws it as a dimmed `—`. A
`latestQuarter` or `lastFourQuarters` reference to either line is a defect,
because the first is `null` for one quarter in four and the second does not
exist. A test in STA-226 rejects both. A metric that needs a share count
reads `dilutedShares @ fiscalYear(0)`, which a 10-K always reports.
`metrics.ts` exports the set of flow lines as `flowLineKeys`, so the tests of
this rule and `completeQuarters` read one list.

**A derived quarter is a derived claim.** A quarter is the figure up to the
end of the quarter minus the figure up to the end of the quarter before. The
figure up to a fourth quarter is the fiscal year of the annual table, and the
figure up to a second or third quarter is the six-month or nine-month figure
of the `yearToDate` table. The figure up to the quarter before is the first
quarter or the year-to-date figure when a table reports it, and the reported
quarters of the fiscal year otherwise. So a fourth quarter is FY − nine
months when the `yearToDate` table reports the nine months, and
FY − Q1 − Q2 − Q3 otherwise. The cash flow statement gets Q2 = six months − Q1
and Q3 = nine months − six months. A first quarter is
never derived. A missing input, a text value or an input with no period keeps
the point `null`. When the quarterly window starts after the first quarter of
a fiscal year, the earlier quarters of that year are outside the table. So the
oldest fourth quarter can stay `null`, unless the `yearToDate` table holds the
nine-month figure of its fiscal year. The claim has the id `metric.{key}.Q{q}-FY{year}` (§3), the
label and unit of its line, and a `DerivedSource` whose formula names the
period of each input, such as `FY2025 − 9 months to Q3 FY2025`. Its `period`
is the quarter of its column, although its inputs do not share one period.
This is the one exception to the `Claim.period` rule of §3: the column fixes
the period, and a `null` period would hide which quarter the figure covers.

**The tab reads completed sections.** `metrics.ts` exports
`completeSections(sections): CompletedSections`. It returns a new object with
the same sections, except that `financials` holds the three statements with
their quarterly tables completed by `completeQuarters`. `useCompany` calls it
once each time a section loads, and hands the result to the tab.
`evaluateMetric`, `evaluateChecks`, `claimsOf` and `figureGroupsOf` take
`CompletedSections` and never the sections of the port. STA-224 brands the
type, so the compiler rejects a call with the sections of the port.

**The types in code.** STA-224 writes the types of §3 and §4 in
`src/lib/company/types.ts`, for the masthead, the Overview tab and the
Financials tab. The port expansion adds the section types and the port methods
of the other five tabs, so the tab tickets can run in parallel. The code
differs from the diagrams in four details:

- Every field is `readonly`, and every list is a `readonly` array
  (`AGENTS.md` "TypeScript-Specific Guidelines").
- `DerivedSource.inputs` is the tuple `readonly [Claim, ...Claim[]]`, so the
  compiler enforces the `1..*` of the diagram.
- `CompanySections` names the sections that `completeSections` takes. It has
  one field for each section that the port returns, and `null` marks a section
  that has not loaded.
- `MetricKey` sits in `types.ts`, because `SectorBenchmark` reads it. It lists
  the metrics of the Overview and Valuation benchmarks, the metrics that the
  checks read, and `enterpriseValue`, which EV/EBIT reads. The tickets that add
  metrics add their keys.

**What the port returns and what `metrics.ts` derives.** The port returns
every reported figure. It also returns the derived figures whose inputs are in
no section. `src/lib/company/metrics.ts` derives every other figure from the
sections.

| The port returns                                                                                                                         | `metrics.ts` derives                                                                                                                                                                                         |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Statement lines, prices, Treasury yields, dividends per share, share counts bought back and issued to staff, holdings, pay, people, subsidiaries, filings | Margins, free cash flow, growth a year, growth per year over ten years (CAGR), long-term assets and liabilities, market cap, enterprise value, P/E, P/FCF, P/B, EV/EBIT, earnings, FCF, dividend and buyback yields, payout, net buybacks, total shareholder yield, ranges and medians over ten years |
| Sector quartiles and medians (inputs: each peer's figure)                                                                               | Fourth-quarter and three-month figures of the flow lines, sums of the flow lines over the last four quarters                                                                                                 |
| Institution totals over all 13F filers, insider shares bought and sold per year (inputs: each 13F or Form 4 figure)                      | Per-row and section-field figures (§5): price change over one month, segment and region shares of revenue, ownership shares, a fund's share of the company and its change over a quarter, stake percentages, pay mix, tenure, net shares bought back, net insider shares, subsidiary count (a count of reported rows, §5) |

No section type holds news, forecasts, analyst ratings, price targets, a fair
value or community content. Every field is a past fact from a filing or a
market dataset.

## 5. Metrics, checks and results

A metric or a check reads figures at named periods. The period model has
three parts:

- A **figure reference** (`FigureRef`) names one figure: a statement line, a
  metric or a market figure, and the period to read it at.
- A **period selector** picks one period, relative to the latest data.
- A **period window** picks a run of fiscal years. A figure reference with a
  window reads one figure for each year.

```mermaid
classDiagram
    class FigureRef {
        +from: InputKind
        +key: FigureKey
        +at: Nullable~PeriodChoice~
    }
    class InputKind {
        <<enumeration>>
        line
        metric
        market
    }
    class PeriodChoice {
        <<union>>
    }
    class SamePeriod {
        +kind: samePeriod
    }
    class FiscalYearBack {
        +kind: fiscalYear
        +yearsBack: number
    }
    class LatestQuarter {
        +kind: latestQuarter
    }
    class LastFourQuarters {
        +kind: lastFourQuarters
    }
    class LatestClose {
        +kind: latestClose
    }
    class LastFiscalYears {
        +kind: lastFiscalYears
        +count: number
    }
    FigureRef --> InputKind
    FigureRef --> PeriodChoice : at
    PeriodChoice <|-- SamePeriod
    PeriodChoice <|-- FiscalYearBack
    PeriodChoice <|-- LatestQuarter
    PeriodChoice <|-- LastFourQuarters
    PeriodChoice <|-- LatestClose
    PeriodChoice <|-- LastFiscalYears
    note for PeriodChoice "LastFiscalYears is a period window. Every other variant selects one period."
```

The variants of `PeriodChoice`:

| Variant                    | Picks                                                                          | Resolves to |
| -------------------------- | ------------------------------------------------------------------------------ | ----------- |
| `fiscalYear`, `yearsBack`  | The fiscal year `yearsBack` years before the latest covered one (§4). `0` is that one. | one value   |
| `latestQuarter`            | The latest column of the quarterly table: three months, or a quarter end       | one value   |
| `lastFourQuarters`         | The sum of a flow line over the last four quarters that `metrics.ts` derives   | one value   |
| `latestClose`              | The latest daily value of a market figure: a closing price or a daily yield   | one value   |
| `samePeriod`               | The period that a per-period metric is evaluated for                           | one value   |
| `lastFiscalYears`, `count` | The last `count` fiscal years up to the latest covered one (§4), oldest first  | `count` values |

A value is a `Figure` for a statement line or a market figure. For a metric,
a value is the metric's `MetricResult`, so the caller keeps a failed guard
and its input claim. The rules below say how a metric and a check read a
`MetricResult`.

`FigureKey` is `LineKey`, `MetricKey` or `MarketKey`, as `from` says. In
code, `FigureRef` is a union with one member for each `from`, so the
compiler rejects a `LineKey` with `from: "metric"`. `at` is `null` only when the key names a point metric, because a point metric
fixes the periods of its own inputs. A window always resolves to `count`
values. A year with no figure gives a `null` at its position, so a company
with three years of filings gives seven `null` figures in a 10-year window.

**Which table a statement line reads.** `fiscalYear`, `lastFiscalYears` and
`samePeriod` at a fiscal year read the annual table of the line's statement
(§4). `latestQuarter` reads the quarterly table. For a balance sheet line,
that column is the latest quarter end. `lastFourQuarters` reads the sum that
`metrics.ts` derives, which exists for the flow lines only (§4). A balance
sheet line, `dilutedShares` or `dilutedEps` with `lastFourQuarters` is a
defect, and so is `dilutedShares` or `dilutedEps` with `latestQuarter`. A
test in STA-226 rejects each of them. `isValidFigureRef(ref)` in `metrics.ts`
returns `false` for each of these defects and for each market pair outside
the table below. A test runs it over every input of every metric. Resolution reads `CompletedSections`
(§4), so it reads the completed quarterly table and never the table from the
port. For a flow line, the latest quarterly column can be a derived quarter:
a fourth quarter of the income statement, or a second, third or fourth
quarter of the cash flow statement.

**Which field a market figure reads.** `MarketKey` is one of `price`,
`priceAtFiscalYearEnd` and `treasuryYield10y`. Each pair of key and period
reads one section field:

| `MarketKey`            | Period choices                                    | Section field                                   |
| ---------------------- | ------------------------------------------------- | ----------------------------------------------- |
| `price`                | `latestClose`                                     | `MastheadSection.price`                         |
| `priceAtFiscalYearEnd` | `fiscalYear`, `samePeriod`, `lastFiscalYears`     | `MastheadSection.priceAtFiscalYearEnds`         |
| `treasuryYield10y`     | `latestClose`                                     | `ValuationSection.treasuryYieldNow`             |
| `treasuryYield10y`     | `fiscalYear`, `samePeriod`, `lastFiscalYears`     | `ValuationSection.treasuryYieldAtFiscalYearEnds` |

A fiscal year choice on a year-end series reads the instant at the end of
that fiscal year, by the "same period" rule of §3. Any other pair is a
defect, and a test in STA-226 rejects it.

**What the metric machinery covers.** `Metric`, `FigureRef` and
`evaluateMetric` cover the checks and the page-level metrics. A page-level
metric is a figure whose inputs are statement lines, other metrics or the
market figures above, such as a margin, a yield or a 10-year median. Each one
has a `MetricKey`. The other derived figures read a section field that no
`FigureKey` names, and most of them exist once for each row of a list. A
`FigureKey` is page-level, so no key can name a figure of one row.

For these figures, `metrics.ts` has one named function each. The function
reads the section fields directly and returns a `Figure`. A value is a claim
with a `DerivedSource`: the formula as text and the section figures as
inputs. If an input is `null` or a divisor is not above 0, the function
returns `null`. A function that gives several parts, such as the three
ownership shares, returns one `Figure` for each part. §3 gives the ids.

| Derived figure                        | Function                  | Inputs                                                                   |
| ------------------------------------- | ------------------------- | ------------------------------------------------------------------------ |
| Price change over one month           | `priceChangeOneMonth`     | `MastheadSection.price`, `MastheadSection.priceMonthEarlier`             |
| Segment or region share of revenue    | `revenueShare`            | the `RevenuePart.revenue` of the row and of every row of its list        |
| Ownership shares                      | `ownershipShares`         | `OwnershipSummary.institutionShares`, `insiderShares`, `sharesOutstanding` |
| A fund's share of the company         | `fundShare`               | `FundHolding.shares`, `OwnershipSummary.sharesOutstanding`               |
| A fund's change over a quarter        | `fundChange`              | `FundHolding.shares`, `FundHolding.sharesQuarterEarlier`                 |
| Stake percentage                      | `stakePercent`            | `Stake.sharesHeld`, `Stake.sharesOutstanding`                            |
| Growth per year over ten years (CAGR) | `growthPerYear`           | the earliest and the latest annual point of a `StatementLine`            |
| Pay mix                               | `payMix`                  | `salary`, `bonus`, `stockAwards` and `other` of the latest `PayYear`     |
| Tenure in years                       | `tenure`                  | `Person.since` or `Profile.chiefExecutiveSince`                          |
| Net shares bought back, per year      | `netSharesBoughtBack`     | `sharesRepurchased` and `sharesIssuedToStaff` at the same fiscal year    |
| Net insider shares, per year          | `netInsiderShares`        | `insiderSharesBought` and `insiderSharesSold` at the same fiscal year    |
| Subsidiary count                      | `subsidiaryCount`         | none, the Exhibit 21 list itself (§8)                                    |

`tenure` measures to the `filedOn` date of the filing that reports `since`.
That date is a field of a `Filing`, not a claim, so it is not an input. The
formula text names it, such as "Years from the start date to 24 Apr 2026, the
filing date of the DEF 14A". `subsidiaryCount` counts the rows of the Exhibit
21 list that `RelationshipsSection.subsidiaries` carries, so no section field
holds the count. It is the one function of the table whose claim is reported,
not derived. Its source is a `ReportedSource` for the Exhibit 21 list, and it
has no input claims. A row exists even when its jurisdiction is `null`, so
the count includes that row. An empty list gives a count of 0, and the claim
still names the exhibit. §8 holds the question and this answer.

STA-230 writes `priceChangeOneMonth`, `revenueShare(overview, list,
position)` and `ownershipShares`, the functions whose inputs are in the
sections of `types.ts`. `ownershipShares` gives the parts `institutions`,
`insiders` and `public`. The public holds the shares outstanding that
neither institutions nor insiders hold. When institutions and insiders
together hold more than the shares outstanding, the public share is `null`,
not a negative share. This happens when the reported holdings overlap, for
example when several 13F filers report the same shares. STA-253 writes
`tenure`. It counts whole years, in the unit `count`, and a `since` in the
unit `year` counts from that year. The `executivesAndBoard` block reads
`since` and not the tenure, so the DEF 14A stays in the sources index when
the tenure is `null`. A person with neither a `since` nor an `independence`
claim gives the block no claim, because `Person` has no claim for the row
itself. STA-253 also writes `payMix`. Each share divides one part of the
latest `PayYear` by the four parts added up, so a missing part makes every
share `null`. The `payMix` block reads the four parts, not the shares, so the
DEF 14A stays in the index then. The other functions wait for the
section types of their tabs.

These functions have no `MetricKey`, no `FigureRef` and no guard, and no
check reads them. A check that needs one of these figures first needs a
`MetricKey`, and a new `FigureKey` for each input. The defect tests of this
section cover `FigureRef` pairs only, so they do not reject these functions.

```mermaid
classDiagram
    class Metric {
        <<abstract>>
        +key: MetricKey
        +name: string
        +formula: string
        +unit: Unit
        +inputs: FigureRef[]
        +guards: Guard[]
        +minPoints: Nullable~number~
    }
    class PointMetric {
        +kind: point
    }
    class PeriodMetric {
        +kind: perPeriod
    }
    class Guard {
        +input: FigureRef
        +comparison: Comparison
        +value: number
    }
    class MetricResult {
        <<union>>
    }
    class MetricValue {
        +kind: value
        +claim: Claim
    }
    class MissingInput {
        +kind: missingInput
    }
    class ShortHistory {
        +kind: shortHistory
    }
    class FailedGuard {
        +kind: failedGuard
        +guard: Guard
        +input: Claim
    }
    Metric <|-- PointMetric
    Metric <|-- PeriodMetric
    Metric --> FigureRef : inputs
    Metric *-- Guard
    MetricResult <|-- MetricValue
    MetricResult <|-- MissingInput
    MetricResult <|-- ShortHistory
    MetricResult <|-- FailedGuard
```

**A metric is data, not code.** A `Metric` holds no function, so it
serialises, and a §7 literal is the whole of its metric. `metrics.ts` holds
the arithmetic:

- `formulas: Record<MetricKey, Formula>` holds one function for each
  `MetricKey`. A `Formula` is `(inputs: ResolvedInput[]) => number`. It gets
  the inputs in the order of `Metric.inputs` and does the arithmetic only.
- `metrics: Record<MetricKey, Metric>` holds one `Metric` for each
  `MetricKey`.
- `evaluateMetric(key, sections, period)` returns a `MetricResult`. It reads
  the metric from `metrics[key]`, so a metric input evaluates the other
  metric by its key. `sections` is `CompletedSections` (§4).
  `period` is the period of a per-period metric, and `null` for a point
  metric, which is the default. The function resolves each input, then applies the rules below in
  order, then calls the formula and builds the claim.

The rules, in order:

1. If a single-period input resolves to a metric whose result is not
   `value`, the metric returns that same result. So the innermost guard
   reaches the check.
2. If a single-period input is `null`, the result is `missingInput`.
3. If a window input has fewer points than `minPoints` that are not missing,
   the result is `shortHistory`. A point is missing when it is `null`, or when
   it is a metric result other than `value`. This is the same reason that a
   `periodCount` check gives for a short window, so two checks on one tab
   explain a short history the same way.
4. `metrics.ts` checks the guards in the order of `Metric.guards`. The first
   guard that fails gives `failedGuard`, with that guard and the claim of its
   input.

`ResolvedInput` is a `Claim` for a single period, because rules 1 and 2 have
passed. It is a `Figure[]` for a window, with `null` at each missing point.

- A **point metric** gives one figure, such as the current ratio now. Each
  input names its own period, and no input uses `samePeriod`.
- A **per-period metric** gives one figure for any period that its inputs
  share, such as free cash flow in FY2021. Every input uses `samePeriod`.
  `metrics.ts` resolves each input at the given period, with the "same
  period" rule of §3. It pairs inputs by period and never by array position.
  So a per-period metric can be read at one fiscal year or over a window, like
  a statement line.
- `MetricResult` says how the evaluation ended:
  - `value`: the metric has a claim. The claim has a `DerivedSource` with the
    metric's formula and the input claims.
  - `missingInput`: a single-period input is `null`. The page draws a dimmed
    `—`.
  - `shortHistory`: a window input has fewer than `minPoints` points. The
    page draws a dimmed `—`.
  - `failedGuard`: an input fails a guard. The page draws a dimmed `—`, and a
    check names the guard and the input claim in its sentence.
- A **guard** is a condition that an input must meet before the formula has
  a reading, for example "diluted EPS above 0". `Guard.input` is a
  `FigureRef` equal to one entry of `Metric.inputs`. It names the key and the
  period, so it picks one input even when two inputs share a key. Growth over
  a year reads `revenue @ fiscalYear(0)` and `revenue @ fiscalYear(1)`, and
  guards the second one only. Every ratio metric guards its divisor with
  "above 0". §6 lists the guards of the first metrics.
- A guard names a single-period input only. A `Guard.input` whose `at` is a
  `lastFiscalYears` window is a defect, and a test in STA-226 rejects it. A
  metric that needs a condition on each point of a window reads a per-period
  metric that carries the guard. `priceToEarningsMedian10y` does this through
  `priceToEarningsAtYearEnd`.
- `minPoints` is the least number of points that each window input needs.
  It is `null` for a metric with no window input, and a whole number of at
  least 1 for a metric with one. A test in STA-226 rejects each mismatch.
  A range or a growth rate
  over a window takes `2`, as `DESIGN.md` §8 asks. A median over a window
  takes half the window, rounded up, so a 10-year median takes `5`. A range
  shows the years it has, and its label names them. A median of two years
  is no picture of ten years, and V1 compares the P/E now with that picture.
  So on the Valuation tab, a company with three years shows its range bar
  with a dimmed median.
- In a window, a point whose metric result is not `value` counts as a missing
  point.

```mermaid
classDiagram
    class Check {
        +id: CheckId
        +area: CheckArea
        +name: string
        +rule: string
        +subject: FigureRef
        +threshold: Threshold
        +sections: SectionKey[]
    }
    class Threshold {
        <<union>>
    }
    class ValueThreshold {
        +kind: value
        +comparison: Comparison
        +value: number
    }
    class FigureThreshold {
        +kind: figure
        +comparison: Comparison
        +against: FigureRef
    }
    class PeriodCountThreshold {
        +kind: periodCount
        +condition: Comparison
        +conditionValue: number
        +required: number
    }
    class CheckResult {
        +check: Check
        +state: CheckState
        +reason: Nullable~NotEnoughDataReason~
        +sentence: SentencePart[]
        +claims: Claim[]
    }
    class SentencePart {
        <<union>>
    }
    class AreaSummary {
        +area: CheckArea
        +results: CheckResult[]
        +metCount: number
    }
    class CheckState {
        <<enumeration>>
        met
        notMet
        notEnoughData
    }
    class NotEnoughDataReason {
        <<enumeration>>
        missingSection
        missingInput
        failedGuard
        shortHistory
    }
    class CheckArea {
        <<enumeration>>
        balanceSheet
        profitability
        valuation
        shareholderReturns
        consistency
    }
    Check --> FigureRef : subject
    Check *-- Threshold
    Threshold <|-- ValueThreshold
    Threshold <|-- FigureThreshold
    Threshold <|-- PeriodCountThreshold
    CheckResult --> Check
    CheckResult --> CheckState
    CheckResult --> NotEnoughDataReason
    CheckResult *-- SentencePart
    CheckResult --> "0..*" Claim : claims
    AreaSummary *-- CheckResult
    AreaSummary --> CheckArea
    note for SentencePart "A text part or a figure part"
```

- `CheckId` is the short code in the §6 table, such as `S1`. `MetricKey`
  names one metric in `metrics.ts`. §6's metric table lists the metrics that
  the checks read, which is part of the set. STA-229 also defines the two
  benchmark metrics that no check reads, because `formulas` needs a function
  for each `MetricKey`. `operatingMargin` is a per-period metric,
  `operatingIncome @ samePeriod` ÷ `revenue @ samePeriod`, with the guard
  `revenue @ samePeriod` above 0. `buybackYield` is a point metric,
  (`shareRepurchases @ lastFourQuarters` − `shareIssuanceProceeds @
  lastFourQuarters`) ÷ `marketCap`, with the guard `marketCap` above 0. The
  port expansion defines the three Valuation benchmark metrics that
  `ValuationSection` names, and `enterpriseValue`. Each is a point metric that
  reads the latest fiscal year and the latest quarter end, as the P/E and
  return on equity do:
  - `priceToFreeCashFlow` is `marketCap` ÷ `freeCashFlow @ fiscalYear(0)`,
    with the guard `freeCashFlow @ fiscalYear(0)` above 0.
  - `priceToBook` is `marketCap` ÷ `shareholdersEquity @ latestQuarter`, with
    the guard `shareholdersEquity @ latestQuarter` above 0.
  - `enterpriseValue` is `marketCap` + `totalDebt` −
    `cashAndShortTermInvestments @ latestQuarter`, with no guard. When the
    latest quarter has no `shortTermDebt` or no `longTermDebt` line,
    `totalDebt` is `missingInput`, so `enterpriseValue` and
    `enterpriseValueToEbit` are `missingInput` too. This is deliberate. A
    missing line is not zero debt, and the page does not invent a figure. A
    filer with no debt shows an enterprise value only when the adapter
    reports a debt line of 0.
  - `enterpriseValueToEbit` is `enterpriseValue` ÷ `operatingIncome @
    fiscalYear(0)`, with the guard `operatingIncome @ fiscalYear(0)` above 0.

  The tab tickets add the rest.
- `Comparison` is one of `above`, `atLeast`, `below` or `atMost`.
- `Check.subject` is the figure that the check tests.
- A `Threshold` is one of three kinds:
  - `value` compares the subject with a fixed number, such as `1.5`. For a
    percent unit, the number is a fraction, as for a claim (§3). So P1's
    "below 5%" is `0.05`, and P2's "at least 15%" is `0.15`.
  - `figure` compares the subject with another figure. The subject and the
    `against` figure have the same unit, and a test in STA-226 checks each
    `figure` threshold. That figure can be
    another metric, such as total debt, or the same line or metric at another
    period, such as diluted shares five years earlier.
  - `periodCount` counts the periods that meet a condition. The subject must
    read a window. The check counts the points of the window that meet
    `condition conditionValue`, such as "above 0".
- A `periodCount` check with `k` points that meet the condition and `m`
  missing points has this result:
  - met, if `k` is at least `required`.
  - not met, if `k + m` is below `required`. The missing years cannot change
    the result.
  - not enough data, reason `shortHistory`, in every other case.
- `checks.ts` makes the count a derived claim, `check.{id}.count`, with the
  points of the window as inputs. The sentence shows it, such as "9 of 10
  years".
- A window subject goes with a `periodCount` threshold only, and a
  `periodCount` threshold needs a window subject. Any other pair is a defect,
  and a test in STA-226 rejects it.
- `checks.ts` resolves the subject and the threshold figure to a `Figure`
  or a `MetricResult`, and maps them onto the result in this order. The first
  step that matches decides.
  1. A section in `Check.sections` is absent: not enough data, reason
     `missingSection`.
  2. The threshold is `periodCount`: the count rule above decides, with
     reason `shortHistory` for not enough data. A point of the window that is
     a `null` figure or a metric result other than `value` is one missing
     point, counted in `m`. Steps 3 and 4 never apply to a window subject.
  3. For a single-period subject: the subject or the threshold figure is a
     `null` figure, or a `missingInput` or `shortHistory` result. The result
     is not enough data, with reason `missingInput` for a `null` figure and
     the reason of the metric result otherwise.
  4. For a single-period subject: the subject or the threshold figure is a
     `failedGuard` result. The result is not enough data, reason
     `failedGuard`. The sentence names the guard and draws its input claim,
     such as "Diluted EPS (−$1.20) is not above 0, so the P/E has no
     reading".
     In steps 3 and 4, `checks.ts` reads the subject first.
  5. Otherwise the check compares the claims of the two `value` results, or
     the claim with the fixed number, and is met or not met.
- A `SentencePart` is either text or a figure. A figure part holds a `Figure`,
  so a missing input draws a dimmed `—` inside the sentence.
- `CheckResult.claims` lists the claims of every figure in the sentence. The
  quiet source line under the sentence is `sourcesOf(claims)`. The list can
  be empty. Step 1 resolves nothing, and a sentence whose figures are all
  `null` has no claim.
- `evaluateChecks(sections: CompletedSections)` in
  `src/lib/company/checks.ts` returns one
  `AreaSummary` for each area, in the order of `CheckArea`.
- No type has an overall score. The page never adds the met counts together.

**The checks in code.** STA-231 writes the check set of §6 and
`evaluateChecks` in `checks.ts`. The code differs from the diagram in three
details:

- `Check.sections` lists keys of `CompanySections`, so a check can name only
  a section that exists. V2 lists the masthead, the Financials and the
  Valuation sections. Until the Valuation section loads, V2 reads "not
  enough data", reason `missingSection`.
- `Check.rule`, `CheckResult.sentence` and the count claim
  `check.{id}.count` wait for the ticket that draws the check card.
- `CheckResult.claims` holds the claims that decide the state: the subject and
  the threshold figure, the input claim of a failed guard, or the points of a
  window.

A claim value that is not a finite number, such as the string `"66,000,000"`,
counts as missing. In a window it is one missing point, counted in `m`. For a
single-period subject it gives not enough data, reason `missingInput`. An
unreadable figure never makes a check "not met".

## 6. The first check set

The mock-up has seven checks. Each area needs two to four checks, so this set
adds four: return on equity, free cash flow yield against the Treasury,
dividends within free cash flow, and positive net income.

The table writes a figure reference as `key @ period`. For example,
`line dilutedShares @ fiscalYear(5)` is the reported diluted shares five
fiscal years before the latest. A point metric has no `@`.

| #   | Area                | Name                                                  | Subject                                              | Threshold                                              | Sections                        |
| --- | ------------------- | ----------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------ | ------------------------------- |
| B1  | Balance sheet       | Cash and short-term investments above total debt     | `line cashAndShortTermInvestments @ latestQuarter`   | above `totalDebt`                                      | Financials                      |
| B2  | Balance sheet       | Current ratio of at least 1.5                         | `currentRatio`                                       | at least 1.5                                           | Financials                      |
| P1  | Profitability       | Stock-based pay below 5% of revenue                   | `stockPayToRevenue`                                  | below 5%                                               | Financials                      |
| P2  | Profitability       | Return on equity of at least 15%                      | `returnOnEquity`                                     | at least 15%                                           | Financials                      |
| V1  | Valuation           | P/E below its own 10-year median                      | `priceToEarnings`                                    | below `priceToEarningsMedian10y`                       | Masthead, Financials            |
| V2  | Valuation           | Free cash flow yield above the 10-year Treasury yield | `freeCashFlowYield`                                  | above `market treasuryYield10y @ latestClose`          | Masthead, Financials, Valuation |
| S1  | Shareholder returns | Fewer diluted shares than five years ago              | `line dilutedShares @ fiscalYear(0)`                 | below `line dilutedShares @ fiscalYear(5)`             | Financials                      |
| S2  | Shareholder returns | Dividend yield of at least 2%                         | `dividendYield`                                      | at least 2%                                            | Masthead, Financials            |
| S3  | Shareholder returns | Dividends paid within free cash flow                  | `line dividendsPaid @ fiscalYear(0)`                 | at most `freeCashFlow @ fiscalYear(0)`                 | Financials                      |
| C1  | Consistency         | Free cash flow positive in at least 8 of 10 years     | `freeCashFlow @ lastFiscalYears(10)`                 | period count: above 0 in at least 8                    | Financials                      |
| C2  | Consistency         | Net income positive in at least 8 of 10 years         | `line netIncome @ lastFiscalYears(10)`               | period count: above 0 in at least 8                    | Financials                      |

Each name states the rule. No name judges the company. S1 compares fiscal
years, not quarters as the mock-up did, so both figures come from the annual
table. S2 uses dividends paid over the last four quarters instead of the
dividend per share, so the check needs no Shareholder returns section. It
still reads the price from the masthead through `marketCap`.

S3 compares dividends paid with free cash flow directly, not through the
ratio `dividendsToFreeCashFlow`. The direct comparison is sound for every
sign. A company that pays $1.0B in dividends with free cash flow of −$2.0B
gets "not met", because $1.0B is not at most −$2.0B.

**Checks that read a later section.** STA-224 writes the masthead, the
Overview and the Financials sections. V2 reads `treasuryYield10y` from the
Valuation section, which `getValuation` serves. Every other check has its
inputs after the Financials Tab milestone.

The metrics that the checks read:

| Metric                     | Kind       | Formula                                                                                                  | Guards                            | Unit    |
| -------------------------- | ---------- | -------------------------------------------------------------------------------------------------------- | --------------------------------- | ------- |
| `totalDebt`                | point      | `shortTermDebt @ latestQuarter` + `longTermDebt @ latestQuarter`                                         | none                              | usd     |
| `currentRatio`             | point      | `totalCurrentAssets @ latestQuarter` ÷ `totalCurrentLiabilities @ latestQuarter`                         | `totalCurrentLiabilities @ latestQuarter` above 0 | ratio   |
| `stockPayToRevenue`        | point      | `shareBasedCompensation @ fiscalYear(0)` ÷ `revenue @ fiscalYear(0)`                                     | `revenue @ fiscalYear(0)` above 0 | percent |
| `returnOnEquity`           | point      | `netIncome @ fiscalYear(0)` ÷ `shareholdersEquity @ latestQuarter`                                       | `shareholdersEquity @ latestQuarter` above 0 | percent |
| `marketCap`                | point      | `price @ latestClose` × `dilutedShares @ fiscalYear(0)`                                                  | none                              | usd     |
| `priceToEarnings`          | point      | `price @ latestClose` ÷ `dilutedEps @ fiscalYear(0)`                                                     | `dilutedEps @ fiscalYear(0)` above 0 | ratio   |
| `priceToEarningsAtYearEnd` | per period | `priceAtFiscalYearEnd @ samePeriod` ÷ `dilutedEps @ samePeriod`                                          | `dilutedEps @ samePeriod` above 0 | ratio   |
| `priceToEarningsMedian10y` | point      | Median of `priceToEarningsAtYearEnd @ lastFiscalYears(10)`, over the points that are not missing        | none, `minPoints` 5               | ratio   |
| `freeCashFlow`             | per period | `operatingCashFlow @ samePeriod` − `capitalExpenditure @ samePeriod`                                     | none                              | usd     |
| `freeCashFlowYield`        | point      | `freeCashFlow @ fiscalYear(0)` ÷ `marketCap`                                                             | `marketCap` above 0               | percent |
| `dividendYield`            | point      | `dividendsPaid @ lastFourQuarters` ÷ `marketCap`                                                         | `marketCap` above 0               | percent |

Every metric in the table has `minPoints: null` except
`priceToEarningsMedian10y`. The median needs points, not a sign. It has
`minPoints: 5` (§5). If fewer than 5 of the 10 years have a P/E, the median
result is `shortHistory`, and V1 reads "not enough data", reason
`shortHistory`. C1 gives the same reason for the same company.

`marketCap` reads the share count of the latest fiscal year, like the P/E,
which reads `dilutedEps @ fiscalYear(0)`. The quarterly share count has no
fourth quarter (§4), so it is not an input of a point metric.

`treasuryYield10y` and `price` are market figures, not metrics.
`cashAndShortTermInvestments`, `dilutedShares`, `dividendsPaid` and
`netIncome` are statement lines.

**Why these guards.** A ratio with a divisor at or below 0 has no reading.
The three guards that matter most for a loss-making company:

| Check | Metric             | Guard                        | Without the guard                                                            |
| ----- | ------------------ | ---------------------------- | ---------------------------------------------------------------------------- |
| P2    | `returnOnEquity`   | `shareholdersEquity` above 0 | Net income −$1.0B over equity −$2.0B gives +50%, so P2 reads "met"          |
| V1    | `priceToEarnings`  | `dilutedEps` above 0         | EPS −$1.20 gives a P/E of −175, below any median, so V1 reads "met"          |
| S3    | none, see above    | none                         | Dividends ÷ free cash flow of −$2.0B gives −50%, at most 100%, so "met"      |

## 7. Worked examples

These examples use made-up figures. Each one shows a case where the types
have to do real work: a check that needs more than one period, a false result
that a guard prevents, or a list that reads the whole page. STA-226 turns each
check example into a unit test of `evaluateChecks`, the fiscal year end
example into a unit test of the pairing and the ids, and the Filings example
into a unit test of `feedsOf`. STA-224 turns the ownership example into its type
test, and STA-227 into its test of the two copies.

### S1: the same line at two periods

```ts
const s1: Check = {
	id: "S1",
	area: "shareholderReturns",
	name: "Fewer diluted shares than five years ago",
	rule: "Diluted shares in the latest fiscal year are below diluted shares five fiscal years earlier",
	subject: { from: "line", key: "dilutedShares", at: { kind: "fiscalYear", yearsBack: 0 } },
	threshold: {
		kind: "figure",
		comparison: "below",
		against: { from: "line", key: "dilutedShares", at: { kind: "fiscalYear", yearsBack: 5 } },
	},
	sections: ["financials"],
}
```

MRDN reports 24.5B diluted shares in FY2026 and 25.0B in FY2021. The subject
resolves to the claim `financials.dilutedShares.FY2026`, and the threshold
figure resolves to `financials.dilutedShares.FY2021`. 24.5B is below 25.0B, so
S1 is met. The sentence reads "Diluted shares in FY2026 (24.5B) are below
diluted shares in FY2021 (25.0B)". If the annual table has no FY2021 column,
the threshold figure is `null` and S1 reads "not enough data", reason
`missingInput`.

### C1: count the years that meet a condition

```ts
const freeCashFlow: PeriodMetric = {
	kind: "perPeriod",
	key: "freeCashFlow",
	name: "Free cash flow",
	formula: "Operating cash flow − capital expenditure",
	unit: "usd",
	inputs: [
		{ from: "line", key: "operatingCashFlow", at: { kind: "samePeriod" } },
		{ from: "line", key: "capitalExpenditure", at: { kind: "samePeriod" } },
	],
	guards: [],
	minPoints: null,
}

const c1: Check = {
	id: "C1",
	area: "consistency",
	name: "Free cash flow positive in at least 8 of 10 years",
	rule: "Free cash flow is above 0 in at least 8 of the last 10 fiscal years",
	subject: { from: "metric", key: "freeCashFlow", at: { kind: "lastFiscalYears", count: 10 } },
	threshold: { kind: "periodCount", condition: "above", conditionValue: 0, required: 8 },
	sections: ["financials"],
}
```

The subject resolves to ten claims, `metric.freeCashFlow.FY2017` to
`metric.freeCashFlow.FY2026`. Each claim has a `DerivedSource` with the two
reported lines of its own year as inputs. MRDN has free cash flow above 0 in
all ten years, so C1 reads met, "10 of 10 years". Four other companies show
the three results:

| Company                     | Years above 0 (`k`) | Missing years (`m`) | Result                            |
| --------------------------- | ------------------- | ------------------- | --------------------------------- |
| Ten years, one negative     | 9                   | 0                   | met, "9 of 10 years"              |
| Ten years, four negative    | 6                   | 0                   | not met, "6 of 10 years"          |
| Listed in 2024, three years | 3                   | 7                   | not enough data, `shortHistory`   |
| Ten years, FY2019 capex missing, nine positive | 9      | 1                   | met, "9 of 10 years"              |

The third company has `k + m = 10`, which is at least 8, so the missing years
can still change the result. A company with three years that has one negative
year has `k + m = 9`. It also reads "not enough data". With two negative years
out of three it has `k + m = 8`, so it still reads "not enough data". With four
years and three negative, `k + m = 7`, and the result is "not met".

The fourth company is the regression case for the step order of §5. Its
FY2019 10-K reports no capital expenditure, so `metric.freeCashFlow.FY2019` is
`missingInput`. The subject is a window, so step 2 decides and step 3 never
runs. The missing year counts in `m`. With `k = 9` at least 8, the result is
met. The count claim `check.C1.count` has the nine claims as inputs.

### V1: pair a masthead series with a statement line by year

```ts
const priceToEarningsAtYearEnd: PeriodMetric = {
	kind: "perPeriod",
	key: "priceToEarningsAtYearEnd",
	name: "P/E at fiscal year end",
	formula: "Price at fiscal year end ÷ diluted EPS",
	unit: "ratio",
	inputs: [
		{ from: "market", key: "priceAtFiscalYearEnd", at: { kind: "samePeriod" } },
		{ from: "line", key: "dilutedEps", at: { kind: "samePeriod" } },
	],
	guards: [
		{
			input: { from: "line", key: "dilutedEps", at: { kind: "samePeriod" } },
			comparison: "above",
			value: 0,
		},
	],
	minPoints: null,
}

const v1: Check = {
	id: "V1",
	area: "valuation",
	name: "P/E below its own 10-year median",
	rule: "The P/E now is below the median P/E at the last 10 fiscal year ends",
	subject: { from: "metric", key: "priceToEarnings", at: null },
	threshold: {
		kind: "figure",
		comparison: "below",
		against: { from: "metric", key: "priceToEarningsMedian10y", at: null },
	},
	sections: ["masthead", "financials"],
}
```

`priceAtFiscalYearEnd` comes from `MastheadSection.priceAtFiscalYearEnds`. Its
periods are instants at each fiscal year end. `dilutedEps` comes from the
annual income table, with fiscal-year periods. `metrics.ts` pairs the price at
the end of FY2023 with the EPS of FY2023 by the "same period" rule of §3, not
by position. If the masthead series starts one year later than the table,
the pairs stay correct, and the first year gets `missingInput`.

Take a company whose FY2020 EPS was −$0.40. The FY2020 point fails its guard
and counts as missing. The median uses the other nine years. The claim
`metric.priceToEarningsMedian10y` has the nine year-end P/E claims as inputs,
so its source card shows each pair of price and EPS.

### P2, V1 and S3 for a loss-making company

A company reports net income of −$1.0B, diluted EPS of −$1.20, shareholders'
equity of −$2.0B, dividends paid of $1.0B and free cash flow of −$2.0B. The
price is $210.60.

| Check | Metric result                                                  | Check result                    | Sentence                                                                             |
| ----- | -------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------ |
| P2    | `returnOnEquity`: `failedGuard`, `shareholdersEquity` −$2.0B   | not enough data, `failedGuard` | "Shareholders' equity (−$2.0B) is not above 0, so return on equity has no reading" |
| V1    | `priceToEarnings`: `failedGuard`, `dilutedEps` −$1.20          | not enough data, `failedGuard` | "Diluted EPS (−$1.20) is not above 0, so the P/E has no reading"                   |
| S3    | none, the check compares two figures                           | not met                         | "Dividends paid in FY2026 ($1.0B) are not within free cash flow (−$2.0B)"          |

Each sentence holds the input claim, so its source line still leads to the
filing. MRDN is profitable, so the sample adapter never reaches these cases.
STA-226 builds this company in a test fixture instead.

### S2 and V2 in the months after a 10-K

This example is the regression case for the quarterly rule of §4. MRDN's
FY2026 ends on 25 Jan 2026, and the 10-K is filed on 12 Mar 2026. On 20 Mar
2026 the Q1 FY2027 10-Q is not filed yet, so the latest quarterly column is
Q4 FY2026. The price is $210.60.

```ts
const marketCap: PointMetric = {
	kind: "point",
	key: "marketCap",
	name: "Market cap",
	formula: "Price × diluted shares, latest fiscal year",
	unit: "usd",
	inputs: [
		{ from: "market", key: "price", at: { kind: "latestClose" } },
		{ from: "line", key: "dilutedShares", at: { kind: "fiscalYear", yearsBack: 0 } },
	],
	guards: [],
	minPoints: null,
}
```

The Q3 10-Q reports 24.533B diluted shares for nine months, the average of
24.6B, 24.5B and 24.5B. The 10-K reports 24.5B for the year. A subtraction
gives a fourth quarter of 24.5B − 24.533B = −0.033B shares, and a market cap
of $210.60 × −0.033B ≈ −$6.95B. The `marketCap` guards of `dividendYield`
and `freeCashFlowYield` then fail, and S2 and V2 read "not enough data",
reason `failedGuard`.

The types prevent each step:

| Step                                         | Result                                                        |
| -------------------------------------------- | ------------------------------------------------------------- |
| `completeQuarters` on `dilutedShares`, Q4    | `null`, because a share count is not a flow                   |
| `marketCap`                                  | $210.60 × 24.5B = $5.16T, from `dilutedShares @ fiscalYear(0)` |
| A metric with `dilutedShares @ latestQuarter` | rejected by the STA-226 test                                 |

S2 reads `dividendsPaid @ lastFourQuarters`. The port returns the Q1
dividends of $102M and `null` at Q2, Q3 and Q4. The `yearToDate` table holds
$210M for six months and $342M for nine months, and the 10-K holds $490M
for the year. `completeSections` derives Q2 = $108M, Q3 = $132M and Q4 =
$148M. The sum over the last four quarters is $490M, with the four
quarterly claims as inputs. The dividend yield is $490M ÷ $5.16T = 0.01%,
so S2 is not met: "Dividend yield (0.01%) is not at least 2%". If a test
passes the sections of the port instead, the compiler rejects the call. At
run time the same input gives three `null` points and `missingInput`.

A sample adapter pinned to September never reaches this window. STA-226
builds the fixture at 20 Mar 2026 for this reason.

### Before the 10-K: 20 Feb 2026

This example is the regression case for the "latest covered" rule of §4. On
20 Feb 2026, MRDN's FY2026 has ended on 25 Jan 2026, and its 10-K comes on
12 Mar 2026. The latest 10-K is the one for FY2025, which ends on 26 Jan 2025.
The latest 10-Q is for Q3 FY2026, which ends on 26 Oct 2025. It reports the
income statement for three months and the cash flow statement for nine.

| Reference          | Latest elapsed, a defect         | Latest covered (§4)      |
| ------------------ | -------------------------------- | ------------------------ |
| `fiscalYear(0)`    | FY2026, a `null` column          | FY2025                   |
| `latestQuarter`    | Q4 FY2026, a `null` column       | Q3 FY2026, 26 Oct 2025   |
| `lastFourQuarters` | Q1 to Q4 FY2026, Q4 `null`       | Q4 FY2025 to Q3 FY2026   |
| Annual table       | FY2017 to FY2026                 | FY2016 to FY2025         |
| Quarterly table    | Q1 FY2025 to Q4 FY2026           | Q4 FY2024 to Q3 FY2026   |

Under the elapsed reading, B1, B2 and P2 read a `null` at `latestQuarter`.
P1, S1, S3 and V1 read a `null` at `fiscalYear(0)`, and S2 and V2 lose
`marketCap`. Nine of the eleven checks read "not enough data", reason
`missingInput`, for six weeks every year. Under the covered reading, every
check reads the same figures as in January. The annual balance sheet view
adds a column for 26 Oct 2025, because that date is not the end of FY2025.

The cash flow statement is the case that tells "covered" from "reported". The
Q3 10-Q reports Q1 FY2026 as three months, and Q2 and Q3 only as six and nine
months. A window that ends at the latest quarter a 10-Q reports ends at Q1
FY2026 for the cash flow statement and at Q3 FY2026 for the other two. S2
then sums dividends over Q2 FY2025 to Q1 FY2026, two quarters behind the
income table beside it. Under the covered reading, `completeQuarters`
derives Q2 and Q3 FY2026 from the six-month and nine-month figures. All three
statements end at Q3 FY2026, and S2 sums Q4 FY2025 to Q3 FY2026. V1 reads its
ten year-end prices over FY2016 to FY2025, the same years as its earnings,
though the FY2026 year-end price exists.

STA-226 builds this fixture next to the one at 20 Mar 2026. Its
`FilingsSection.filings` lists the 10-Q for Q3 FY2026 and no 10-K for FY2026.
A test in the ticket that adds `getFilings` gives a fake port this list and
fails when the port returns a FY2026 column, or a cash flow window that ends
before Q3 FY2026. STA-224 has no `FilingsSection`, so it cannot write the test.

### P/B: one date in two tables

MRDN reports shareholders' equity of $157.3B at 25 Jan 2026. That date ends
FY2026 and also ends Q4 FY2026, so the date sits in two tables:

| Table                       | `Period`                                                 | `ClaimId`                                       |
| --------------------------- | -------------------------------------------------------- | ----------------------------------------------- |
| Annual balance sheet        | `instant`, `fiscalYear: 2026`, `fiscalQuarter: null`     | `financials.shareholdersEquity.2026-01-25`      |
| Quarterly balance sheet     | `instant`, `fiscalYear: 2026`, `fiscalQuarter: 4`        | `financials.shareholdersEquity.Q4-2026-01-25`   |

A per-period P/B at FY2026 reads `shareholdersEquity @ samePeriod` from the
annual table. The annual instant has `fiscalQuarter: null`, so it pairs with
the fiscal year FY2026 by the "same period" rule of §3. The quarterly instant
has `fiscalQuarter: 4` and never pairs with a fiscal year.

On 20 Mar 2026 the latest quarter end is also the end of FY2026. So the
annual view of the balance sheet adds no column for the latest quarter end,
and each id appears once on the page. On 23 Sep 2026 the latest quarter end
is 26 Jul 2026, and the annual view adds the column
`financials.shareholdersEquity.Q2-2026-07-26`.

### Ownership: two copies and the type test

The sample adapter fills `OverviewSection.ownership` and
`RelationshipsSection.ownership` from the same 13F totals, at the quarter end
30 Jun 2026. Institutions hold 16.10B of 24.4B shares, so both bars show
66.0%. A faulty adapter fills the Relationships copy from the 13F totals at
31 Mar 2026 instead, with 15.90B shares, so the bar shows 65.2%. Both copies
carry valid sources. The STA-227 test compares the copies field by field and
fails on `asOf` first: `2026-06-30` against `2026-03-31`.

The type test of §9 walks `OwnershipSummary` like this:

| Field               | Type      | Walk                                               |
| ------------------- | --------- | -------------------------------------------------- |
| `asOf`              | `IsoDate` | passes, a row key of the §4 label rule            |
| `sharesOutstanding` | `Figure`  | stops at `Claim`, so `Claim.value` is not reached |
| `institutionShares` | `Figure`  | stops at `Claim`                                   |
| `insiderShares`     | `Figure`  | stops at `Claim`                                   |

A section type that adds `institutionPercent: number` next to these fields
fails the test. A share of the company is a derived figure, so
`ownershipShares` in `metrics.ts` gives it (§5).

### Filings: the FY2026 10-K row from figure groups

MRDN filed its FY2026 10-K on 12 Mar 2026, with the made-up accession number
`0001234567-26-000012`. The user opens the Filings tab. `getFilings`, the
masthead and four tabs have loaded. `getRelationships` is still loading, and
`getValuation` does not exist yet. The Filings tab passes these groups, among
others, to `feedsOf`:

```ts
// `sections` is the CompletedSections of this example.
const groups: FigureGroup[] = [
	{
		ref: { tab: "overview", block: "checksByArea", label: "Checks by Area", figures: "company" },
		// check.V1 → metric.priceToEarnings → financials.dilutedEps.FY2026 (10-K)
		//                                    → the price (NASDAQ close)
		claims: claimsOf("checksByArea", "company", sections),
	},
	{
		ref: { tab: "financials", block: "incomeTable", label: "Income statement table", figures: "company" },
		// financials.revenue.FY2017 … financials.revenue.FY2026, one 10-K each
		claims: claimsOf("incomeTable", "company", sections),
	},
	{
		ref: { tab: "management", block: "ceoPay", label: "CEO Pay by Year", figures: "company" },
		// management.ceoPay.salary.FY2026 → DEF 14A filed 24 Apr 2026
		claims: claimsOf("ceoPay", "company", sections),
	},
]

const feeds = feedsOf(groups)
```

`feeds.get("0001234567-26-000012")` holds two refs: Overview "Checks by Area"
and Financials "Income statement table". The check reaches the 10-K
through the P/E and the EPS of FY2026. Its price reaches a `MarketDataset`,
which gets no entry. The CEO pay group reaches the DEF 14A only, so it is
absent from the 10-K row.

Then `getRelationships` resolves. The Subsidiaries group reads the
jurisdictions from Exhibit 21, which belongs to the same 10-K. So the next
`feedsOf` call adds Relationships "Owns: Subsidiaries" to the row. If
`getRelationships` rejects instead, the row keeps its two refs.

## 8. Open questions from the epic fog log

**Do sector medians and quartiles come from the company sections or from a
separate sector port?** Settled: from the company sections. `OverviewSection`
and `ValuationSection` each carry `SectorBenchmark` values, disjoint by metric
(§4). The peer group depends on the company, so the figures belong to the
company's data. Each quartile and median is a derived claim with one input
claim for each peer. The source card lists the first ten inputs and counts the
rest. A later backend adapter can read a sector service behind the port, and
the section types stay the same. This note adds no sector port, so the epic
needs no new ticket.

**How does a source reference link to the exact line on SEC EDGAR?** Settled
for the first version, with one part open. `ReportedSource.url` opens the exact
document in the filing: the primary document through the EDGAR Inline XBRL
viewer, or the exhibit, information table or Form 4 itself.
`Filing.accessionNumber` names the filing, and `indexUrl` opens its index.
The source card shows `line` and `xbrlTag`, and the reader finds the line with
the viewer's search. Open: a link that jumps to the one fact inside the
document. EDGAR has no stable anchor for one fact. The backend epic decides if
it stores fact ids. A later field on `ReportedSource` can then carry the id,
and no other type changes.

**Which statements have quarterly and trailing-twelve-month figures, and how
does the page label them?** Settled:

- All three statements have annual and quarterly tables. §4 fixes which
  quarterly points the port returns as `null`.
- Income statement: a 10-Q reports three months for Q1 to Q3, and six or
  nine months to date. For `revenue`, `operatingIncome` and `netIncome`,
  `metrics.ts` derives Q4 by the rule of §4: the fiscal year minus the
  nine-month figure, or minus the reported Q1 to Q3 when no table has the
  nine-month figure. `dilutedShares` and `dilutedEps` do not add up over a
  year, so their Q4 stays `null` (§4).
- Cash flow statement: a 10-Q reports year to date. `metrics.ts` derives each
  quarter as the difference of two year-to-date figures, and Q4 by the same
  rule of §4.
- Balance sheet: each figure is at a quarter end. It has no sum over four
  quarters. The annual view adds a column for the latest quarter end, such as
  "26 Jul 2026", when that date is not the end of the latest fiscal year. At a
  fiscal year end the annual column already shows the date, so the view adds
  no column.
- The flow lines of the income and cash flow statements have a sum over the
  last four quarters. `metrics.ts` derives it with the four quarterly claims
  as inputs. `dilutedShares`, `dilutedEps` and the balance sheet lines have
  no such sum. The page
  labels the column "Last 4 quarters" with the end date under it, such as
  "to 26 Jul 2026". The page does not print the abbreviation "TTM".

**Open for the implementing tickets.** The fifth review raised three questions
that this note leaves to a ticket, and the STA-232 review raised a fourth.
Each one has a default that the ticket takes unless it finds a reason not to.

- STA-226: **Does `marketCap` read a point-in-time share count?** It reads
  `dilutedShares @ fiscalYear(0)`, a weighted average over a year that can be
  eighteen months old. For a company that buys back shares, market cap then
  reads a few percent high, and so do `dividendYield` and
  `freeCashFlowYield`. A `sharesOutstanding` line from the cover page of the
  latest 10-Q or 10-K, the tag `dei:EntityCommonStockSharesOutstanding`,
  fixes this. Default: keep `dilutedShares @ fiscalYear(0)`, and the source
  card reads "diluted shares, latest fiscal year". STA-226 adds
  `sharesOutstanding` as a balance sheet line only with a change to §4 and
  §6 in the same pull request.
- STA-226: **What input does `subsidiaryCount` carry?** A derived count
  takes the `Subsidiary.jurisdiction` claims as inputs, so a company with no
  subsidiaries, or a list with no jurisdictions, gives a derived claim with
  no input. That breaks the `1..*` on `DerivedSource`, and its source card
  traces nowhere.
  Default: `subsidiaryCount` gives a reported claim, with a `ReportedSource`
  for the Exhibit 21 list, the line `Exhibit 21 › Subsidiaries of the
  registrant` and no XBRL tag. A count of 0 still names the exhibit.
- STA-224: **Which ticket owns `CompletedSections`?** `useCompany` (STA-225)
  calls `completeSections`, and `metrics.ts` (STA-226) completes the
  quarters. Settled by the default: STA-224 declares the branded type and
  ships `completeSections` in `metrics.ts` as a function that brands the
  sections and completes nothing. STA-226 then adds `completeQuarters`, and
  `completeSections` holds the completed quarterly tables from that point.
- Financials tab: **Does the annual and quarterly switch flip the chart?**
  `DESIGN.md` §8 puts the switch above both Financials cards. STA-232 has each
  chart read the annual table only (§4). If the switch flips the chart, the
  chart draws quarterly bars while its "Sources" chip names the annual
  filings, and §3 exists to stop that disagreement. Default: the chart follows
  the switch, and its chip reads the same table as the chart. The Financials
  tab ticket passes the chosen period to the chart readers, since `claimsOf`
  takes no period today.

## 9. Enforcement levels

`AGENTS.md` "The Enforcement Ladder" asks each new rule for its level. This
note is level 3, because it has no code. Two of its rules can reach level 1
once STA-224 writes the types:

- "Every figure is a `Figure`": a type test in STA-224 fails when a section
  type has a `number` or an `IsoDate` field. The test walks each section type
  and each type that the section holds, such as `Statement`, `StatementLine`,
  `PayYear` and `OwnershipSummary`. The walk stops at three types and does
  not enter them: `Claim` (so `Figure`), `Period` and `Filing`. A claim is the
  figure itself, a `Period` holds the column keys, and a `Filing` is a source
  document. `Claim.value` and a `MarketDataset` sit inside a claim, so the
  walk never reaches them. The only other exceptions are the row keys that
  the §4 label rule names. §7 walks one type through.
  The test lives in `src/lib/company/types.test.ts`. The walk also skips
  methods, so it passes over the methods of `Ticker`.
- "No section stores a source set": the same type test fails when a section
  type has a field of type `SourceSet` or `FigureGroupRef[]`. STA-226 adds
  this part, because it declares the two types.
- "A block with sector figures gives one group of each": a unit test in
  STA-226 checks that each such block of `figureGroupsOf` gives one group
  with `figures: "company"` and one with `figures: "sector"`, with the same
  `block`, and that no `ClaimId` appears in both. It also checks that the
  company groups hold no claim read from a `SectorBenchmark` field, and that
  the sector group holds only such claims. The test reads `keyFigures`,
  because `peRange` is a Valuation block that STA-232 does not declare. The
  Valuation tab ticket adds the same test for `peRange`.

The period and guard rules reach level 1 through tests. Each worked example
in §7 becomes a unit test in STA-226, and CI runs the tests. A change that
breaks one of the examples fails CI.
