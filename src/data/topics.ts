import type { Topic } from '../types';

/**
 * Course topics — one per assigned reading, each with subtopics following
 * the article's real structure. Add future readings per docs/CONTENT_GUIDE.md.
 */
export const topics: Topic[] = [
  {
    id: 't-ruland',
    code: 'Doc 7',
    title: 'Constitutional Debate in the Philippines (Rüland)',
    description:
      'Jürgen Rüland’s 2003 Asian Survey article on the post-Estrada constitutional debate: the fixed presidential term is the Achilles’ heel of presidentialism, but a shift to parliamentarism would not cure gridlock, power concentration, instability, weak parties, populism, or patronage — incremental amendment of the 1987 Constitution instead.',
    sample: false,
    readingId: 'ruland',
    source: {
      file: 'Pol Sci 157_Torres-Pilapil_Doc 7_Ruland, Jurgen_Constitutional Debate.pdf',
      label: 'Doc 7',
    },
    subtopics: [
      {
        id: 't-ruland-s1',
        title: 'Debate context: EDSA II and the road to charter change',
        summary:
          'The ouster of President Joseph Estrada in January 2001 reignited a charter-change debate running since the 1986 redemocratization; analysts blamed the 1987 Constitution’s fixed presidential term and demanded a shift to parliamentarism.',
        definitions: [
          {
            term: 'Fixed term of office',
            definition:
              'The president serves a set six-year term and cannot be removed by a legislative no-confidence vote — only by impeachment — which is why critics call it the rigidity at the heart of the debate.',
          },
          {
            term: 'EDSA II',
            definition:
              'The January 2001 mass protests on Epifanio de los Santos Avenue that followed the collapsed Estrada impeachment trial and ended with the military withdrawing support and Gloria Macapagal-Arroyo declared president.',
          },
          {
            term: 'Bogus parliamentarianism',
            definition:
              'The discredited parliamentary label of the 1973 Marcos Constitution, whose transitory provisions vested Marcos with the powers of both president and prime minister, suspending any division of powers.',
          },
          {
            term: '1987 Constitution origins',
            definition:
              'Fourth charter (after Malolos 1899, Commonwealth 1935, authoritarian 1973): drafted in under six months by Aquino’s 50-member Commission and ratified by three-fourths in February 1987, reviving 1935 presidentialism (PDF pp. 3–4).',
          },
        ],
        keyArguments: [
          'The Estrada ouster — collapsed impeachment trial, EDSA II, military withdrawal of support — is the turning point that gave the parliamentary-shift clamor unprecedented vigor (PDF p. 6).',
          'Charter change has been persistent since 1986: House resolutions for parliamentarism (1991, 1993), Ramos-era drafts, and the AGORA/Philconsa proposals all failed, partly over suspicions they masked term extension or authoritarian restoration (PDF pp. 4–6).',
          'Rüland’s thesis: shifting to parliamentarism does not necessarily solve the problems blamed on the 1987 Constitution, so incremental amendment without scrapping presidentialism is preferable (PDF p. 1).',
          'Hasty birth left marks: power-vacuum pressure and the Aquino legitimacy gap made the referendum a plebiscite on her regime, while reformers’ faith in detailed rules produced a lengthy, inconsistent text (PDF p. 4).',
        ],
        scholars: [
          {
            name: 'Samuel P. Huntington',
            contribution: 'Third Wave democratization framework situating the Philippines’ consolidation struggles.',
          },
          {
            name: 'Carl H. Landé',
            contribution: 'Analyzed the return of “people power” and raised questions about the constitutionality of Estrada’s replacement.',
          },
          {
            name: 'Jose V. Abueva',
            contribution: 'Documented the transitory provisions that made the 1973 charter “bogus parliamentarianism”; co-edited the federal-republic volume.',
          },
        ],
        examples: [
          'Estrada accused (October 2000) of bribes and kickbacks tied to illegal gambling; impeachment collapsed mid-January 2001 when eleven senators blocked opening an incriminating bank-account envelope.',
          'Chief Justice Hilario Davide declared Vice President Gloria Macapagal-Arroyo president under the “salus populi est suprema lex” doctrine; the Supreme Court later ruled the ouster constitutional.',
          'PIRMA’s anti-term-limits drive and Ramos’s “imperial judiciary” rhetoric let opponents discredit parliamentarism advocacy as a second-term ploy; Cardinal Sin– and Aquino-backed protests killed it.',
        ],
        takeaways: [
          'Anchor every exam answer in the trigger: Estrada’s ouster turned the fixed term from an abstract flaw into a live crisis.',
          'Earlier cha-cha failures show constitutional debates double as elite power struggles — a theme Rüland returns to in his reform agenda.',
        ],
        readingTimeMinutes: 8,
      },
      {
        id: 't-ruland-s2',
        title: '“Perils of presidentialism” under scrutiny',
        summary:
          'Rüland concedes the fixed term is the Achilles’ heel of presidentialism, but finds the further charges — hyper-powerful presidency, veto paralysis, inherent instability, weak parties, populism — exaggerated or misattributed.',
        definitions: [
          {
            term: 'Impeachment as last resort',
            definition:
              'The sole constitutional avenue for removing a sitting president: strictly circumscribed, lengthy, hostage to legislative maneuvering, and offering no certainty of removal even with overwhelming evidence.',
          },
          {
            term: 'Turncoatism',
            definition:
              'The local term for post-election party switching and bandwagoning onto the president’s party, linked by critics to presidential pork-barrel patronage.',
          },
          {
            term: 'Symmetrical bicameralism',
            definition:
              'The House and Senate’s equal legislative powers, which Rüland identifies as the structural source of gridlock: duplicated bills, rival agendas, and lengthy Joint Conference Committee (“Third House”) bargaining.',
          },
        ],
        keyArguments: [
          'Fixed term is the genuine Achilles’ heel: failed impeachment leaves only a lame-duck six-year presidency or extraconstitutional ouster via the military — setting dangerous precedents — and Linz’s warning that a government crisis becomes a regime crisis fits Estrada and Wahid (PDF p. 7).',
          'The “all-powerful presidency” charge is overstated: power varies with leadership style (Aquino underused powers, Ramos shared power with his Cabinet, Estrada’s erratic personalism is the exception), and Cabinet inclusiveness rules plus Commission on Appointments ratification constrain the president (PDF p. 8).',
          'Post-1986 veto use was modest (3.7%, 7.4%, 3.1%, 4.6% across the 8th–11th Congresses), and reform dilution through horse-trading has parliamentary parallels in multiparty coalitions such as pre-1997 Thailand and India (PDF p. 10).',
          'Instability is not proven inherent to presidentialism: Stepan and Skach’s finding is timing-sensitive (Nohlen/Thibaut), Southeast Asian parliamentary regimes collapsed repeatedly, and Latin American breakdowns may reflect conditions that would have felled parliamentary regimes too (Mainwaring and Shugart) (PDF pp. 11–12).',
          'Government form is neither necessary nor sufficient for strong parties — presidential Chile, Costa Rica, and Uruguay built them; parliamentary Thailand and India did not — and Philippine party weakness traces to colonial umbrella politics, Cold War anticommunism, and personalistic culture (PDF p. 13).',
          'Populism is not system-specific: Estrada’s “pro-poor, pro-market” campaign and celebrity senators parallel Thaksin’s Thailand as well as Haider, Berlusconi, and Fortuyn in Europe; the driver is media change and mass-democracy campaigning (PDF p. 14).',
        ],
        scholars: [
          {
            name: 'Juan J. Linz',
            contribution: '“Perils of presidentialism” thesis — government crises become regime crises — whose Latin American debate the Philippine discourse echoes.',
          },
          {
            name: 'Joel Rocamora',
            contribution: 'Claims Filipino presidents out-power even the American president; stresses pork, turncoatism, and reform dilution via horse-trading.',
          },
          {
            name: 'Arend Lijphart',
            contribution: 'Concedes separation of powers lends presidentialism a consensual element; argues presidentialism weakens incentives for cohesive parties.',
          },
          {
            name: 'Emil P. Bolongaita',
            contribution: 'Notes no presidential veto has been overridden since 1935; analyzed the anti-Senate arguments.',
          },
          {
            name: 'Jungug Choi',
            contribution: 'Links the post-1986 fluid multiparty system to the single-term curb — a claim Rüland rebuts via Marcos-era regional-party roots.',
          },
        ],
        examples: [
          'Estrada’s lame-duck-versus-ouster dilemma and Indonesia’s Wahid impeachment as Linz-type regime crises.',
          'Commission on Appointments rejection of Aquino nominees Florencio Abad and Miriam Defensor-Santiago for agrarian reform secretary.',
          'Aquino–Laurel and Estrada–Arroyo vice-presidential fallouts as obstructive split-ticket checks.',
          'Pre-1986 regional parties under Marcos (Laban, Bicol Saro, Pusyon Bisaya, Mindanao Alliance, CCA) contesting the 1980 and 1984 elections.',
          'Celebrity senators Freddy Webb, Robert Jaworski, and Noli de Castro; Thaksin’s million-baht-per-village, 30-baht medicare, and farmer debt-moratorium pledges.',
        ],
        takeaways: [
          'Concede-then-rebut is Rüland’s signature move: grant the fixed-term problem, then show each further charge is exaggerated or shared by parliamentary systems.',
          'For instability and party-system questions, cite paired counterevidence: presidential Chile/Costa Rica/Uruguay versus parliamentary Thailand/India.',
        ],
        readingTimeMinutes: 12,
      },
      {
        id: 't-ruland-s3',
        title: '“Virtues of parliamentarianism” under scrutiny',
        summary:
          'The celebrated parliamentary advantages — flexible no-confidence removal, party discipline, superior development and bureaucratic performance — collapse against Southeast Asian evidence, especially Thailand’s pre-1997 experience.',
        definitions: [
          {
            term: 'Non-constructive no-confidence vote',
            definition:
              'A no-confidence motion that topples a government without simultaneously electing a successor — in pre-1997 Thailand, persistently abused to erode weak multiparty coalitions.',
          },
          {
            term: 'Mercantile political system',
            definition:
              'Rüland’s term (via the Thai case) for politics where entering government is how politicians recoup campaign investments, giving oppositions a standing incentive to topple cabinets quickly.',
          },
          {
            term: 'Semi-presidentialism',
            definition:
              'A French Fifth Republic–style dual-executive model occasionally proposed for the Philippines; Rüland doubts it would survive the cohabitation litmus test there.',
          },
        ],
        keyArguments: [
          'No-confidence flexibility persuades more in theory than practice: weak performance is culturally ingrained, removing prime ministers can be very hard, and stalemated Asian parliamentary regimes repeatedly invited military takeovers (PDF pp. 14–15).',
          'There is no iron law converting parliamentarism into strong parties: Southeast Asian parliamentary parties were personalistic, factionalized power centers, with Thai MPs switching “identical parties” more than four times in a career before 1997 — and anti-defection devices could be grafted onto presidentialism too (PDF pp. 15–16).',
          'The development claim fails its own evidence: Singapore and Malaysia are better classed as hybrid/competitive-electoral authoritarian regimes, and parliamentary India’s low per-capita GDP breaks the alleged causal link (PDF p. 16).',
          'Bureaucratic-continuity and anti-patronage claims ignore Thai parallels — short-lived cabinets, rampant vote buying, chao phor godfathers — and Hutchcroft’s finding that Thailand’s patrimonial administrative state increasingly resembles the Philippine patrimonial oligarchic state (PDF p. 17).',
          'In an ingrained clientelist culture with unchanged political personnel, the effects of institutional engineering are limited — parliamentarism is not a panacea (PDF p. 17).',
        ],
        scholars: [
          {
            name: 'Giovanni Sartori',
            contribution: 'Source of reservations on parliamentary learning effects for party discipline; defender of semi-presidential flexibility that Rüland questions.',
          },
          {
            name: 'Pablo Tangco',
            contribution: 'Philippine proponent of the claim that parliamentary governments develop economies more successfully (Japan, Singapore, Malaysia).',
          },
          {
            name: 'Steven Levitsky and Lucan A. Way',
            contribution: '“Competitive/electoral authoritarianism” categories Rüland uses to disqualify Singapore and Malaysia as parliamentary-development showcases.',
          },
          {
            name: 'Paul Hutchcroft',
            contribution: 'Demonstrated the convergence of Thailand’s patrimonial administrative state with the Philippine patrimonial oligarchic state.',
          },
          {
            name: 'Wolfgang Merkel',
            contribution: 'Source on the cohabitation litmus test that makes Rüland doubt French-style semi-presidentialism for the Philippines.',
          },
        ],
        examples: [
          'Military takeovers of weak parliamentary democracies: Thailand (1947, 1971, 1976, 1991), Burma (1958, 1962), Indonesia (1957), Cambodia (1997), South Korea (1961).',
          'Pre-1997 Thai cabinets reshuffled every few months as oppositions and bypassed coalition partners toppled governments to access electoral spoils.',
          'Thai MPs’ serial party switching before the 1997 Constitution; continuing vote buying and provincial chao phor influence even after it.',
        ],
        takeaways: [
          'Thailand before 1997 is Rüland’s master counterexample: non-constructive no-confidence, party switching, vote buying, and coups under parliamentarism.',
          'Exam-ready line: the debate pairs worst-case thinking on presidentialism with best-case scenarios for parliamentarism.',
        ],
        readingTimeMinutes: 10,
      },
      {
        id: 't-ruland-s4',
        title: 'Reform agenda I: keep presidentialism, fix terms and elections',
        summary:
          'Rüland’s alternative to system change: give the 16-year-old Constitution a fair chance through gradual amendment — a re-electable four-year presidency plus urgent electoral and party-list reforms.',
        definitions: [
          {
            term: 'Party-list system (RA 7941)',
            definition:
              'The proportional-representation complement to majority voting for the House, meant to voice disadvantaged groups — capped in practice at 20% of seats, a 2% entry threshold, and a three-seat ceiling per party.',
          },
          {
            term: 'Majoritarian character',
            definition:
              'The exclusiveness Lijphart attributes to majority voting systems; Rüland argues the 20% party-list cap preserves it in the Philippines despite the hybrid design.',
          },
          {
            term: 'Bogus parties / phantom precincts',
            definition:
              'Manipulation devices of the Philippine electoral process: traditional politicians’ fake party-list vehicles (curbed only after the Bayan Muna v. COMELEC ruling) and fictitious voter rolls requiring technical cleanup.',
          },
        ],
        keyArguments: [
          'Fundamental shifts create enormous transition problems and rarely succeed when attempted (Riggs); constitutions gain legitimacy with age, and endless rewriting reduces the charter to an elite power game that blocks civic-culture consolidation (PDF p. 18).',
          'The fixed term is the hardest flaw to fix without system change, so Rüland proposes a four-year term with one re-election — a return to the 1935 formula letting voters retire nonperformers early while rewarding capable leaders (PDF pp. 18–19).',
          'Term reform must be paired with electoral reform (RA 8189 implementation, voter-list cleanup, computerization), since incumbents could otherwise engineer re-election through the government machinery (PDF p. 19).',
          'Dilute majoritarianism by expanding the party list to half the House seats with a 5% anti-fragmentation threshold and no three-seat ceiling, so reformist parties can enter and mirror real societal cleavages (PDF p. 20).',
        ],
        scholars: [
          {
            name: 'Fred W. Riggs',
            contribution: 'Despite his own reservations on presidentialism, maintains presidential-to-parliamentary shifts have rarely succeeded — Rüland’s transition-risk authority.',
          },
          {
            name: 'Alberto C. Agra',
            contribution: 'Legal critique of the diluted Party-List Law that Rüland draws on.',
          },
          {
            name: 'Gabriella R. Montinola',
            contribution: 'Source for the 1998 outcome data: only 14 of 52 party-list seats filled.',
          },
        ],
        examples: [
          'Party-list underperformance: 122 accredited parties in 1998 and 154 in 2001; only 9.1 million of 34 million registered voters (31.3%) cast party-list votes in 1998.',
          'Congress took eight years to pass the Party-List Law, then capped parties at three seats — proof, for Rüland, that the political class fears a 30-seat lower-class party.',
          'Still-fraudulent and violent elections (including 2001) as the great legitimacy drain making electoral reform the most urgent consolidation task.',
        ],
        takeaways: [
          'Memorize the package: 4 + 4 presidency, RA 8189 enforcement, half-House party list, 5% threshold, no seat ceiling.',
          'Reforms aim at inclusiveness and consensus democracy within presidentialism — the normative spine of the whole agenda.',
        ],
        readingTimeMinutes: 10,
      },
      {
        id: 't-ruland-s5',
        title: 'Reform agenda II: legislature, Senate, federalism, and procedure',
        summary:
          'Procedural fixes without constitutional surgery — deliberation deadlines, declogging local bills, fewer committees, a stronger LEDAC — plus a reformed but retained Senate, caution on federalism, and a constituent-assembly route for amendments.',
        definitions: [
          {
            term: 'Asymmetrical bicameralism',
            definition:
              'Rüland’s Senate proposal: keep a second chamber for consensus democracy but cut it to a supervisory function with a suspensive veto, ending duplication of the legislative process.',
          },
          {
            term: 'Committee hopping',
            definition:
              'Legislators’ rushed rotation across overlapping committee meetings (House 51 and Senate 43 standing committees, ~6 memberships each), producing sub-optimal legislation and blocking specialization.',
          },
          {
            term: 'Three amendment avenues (Art. XVII)',
            definition:
              'Congress as constituent assembly, a constitutional convention, or a people’s initiative — all requiring plebiscite ratification; the initiative’s enabling law was ruled inadequate by the Supreme Court in 1997.',
          },
        ],
        keyArguments: [
          'Gridlock can be eased procedurally: fixed Senate and Conference Committee deliberation periods (the House’s 30-session-day rule as model), shifting symbolic local bills (85–90% of filings) to local governments, and streamlining committees (PDF p. 21).',
          'Keep the Senate — a non-congruent second chamber serves consensual democracy (Lijphart) — but fix its congruence defect (same-class members shuttling between houses) via reduced powers and regional constituencies or local-government representation (PDF p. 22).',
          'Federalism’s Moro-autonomy promise must be weighed against state-count (4–11), demarcation across interspersed Mindanao communities, revenue allocation, and the fate of 1991 Local Government Code decentralization (PDF p. 23).',
          'Against elected-convention purism (whose Southeast Asian record — Indonesia’s Konstituante, the 1971–73 Philippine ConCon — is ambiguous and oligarchy-capturable), Congress should declare itself a constituent assembly, appoint an expert/broad drafting committee, and vote the draft up or down as a whole (PDF pp. 23–24).',
        ],
        scholars: [
          {
            name: 'Josie H. de Leon',
            contribution: 'Source on local-bill dominance and committee-hopping pathologies in the post-Marcos legislature.',
          },
          {
            name: 'Willibold Frehner',
            contribution: 'Documented Luzon’s Senate overrepresentation: 11 of 13 senators elected in 2001 from Luzon, 2 from the Visayas, none from Mindanao.',
          },
          {
            name: 'Aquilino Pimentel Jr.',
            contribution: 'Senate advocate of federalism as a cushion for the Muslim rebellion in the South.',
          },
          {
            name: 'Camilo L. Sabio',
            contribution: 'Philconsa president and spokesman for the non-partisan elected constitutional convention Rüland argues against.',
          },
        ],
        examples: [
          'Ramos’s December 1992 LEDAC — executive plus House/Senate leaders run by Speaker José de Venecia — as the proven coordination mechanism needing fine-tuning.',
          'Controversial 2001 senators Gregorio Honasan and Panfilio Lacson fueling abolition sentiment Rüland resists.',
          'Germany’s Basic Law, drafted by an unelected Parliamentary Council without plebiscite, as proof that purist democratic drafting is not what makes constitutions work.',
        ],
        takeaways: [
          'Rüland’s hierarchy: procedural fixes first, targeted amendments second, system replacement never.',
          'On federalism and conventions his answer is identical in structure: attractive goal, underestimated implementation risks, proceed only with care.',
        ],
        readingTimeMinutes: 10,
      },
    ],
  },
  {
    id: 't-pilapil',
    code: 'Doc 6',
    title: 'Some Arguments for an Institutional Approach to Philippine Politics (Pilapil)',
    description:
      'Gene Lacza Pilapil (PPSJ 2006) argues for a political-science institutional approach to Philippine politics: formal political institutions shape actor strategies and mediate state-society relations, curing the institutional blindness of dominant society-based approaches while staying both holistic and detailed.',
    sample: false,
    readingId: 'pilapil',
    source: {
      file: 'Pol Sci 157_Torres-Pilapil_Doc 6_Pilapil, Gene_Some Arguments for an Institutional Approach.PDF',
      label: 'Doc 6',
    },
    subtopics: [
      {
        id: 't-pilapil-s1',
        title: 'Institutions, institutional approaches, and political institutions',
        summary:
          'Pilapil defines institutions as rules structuring state and social actors’ strategies, then rejects the new institutional economics equal stress on formal plus informal rules in favor of a political-science institutionalism focused on formal (parchment) political rules, and defines political institutions around binding policymaking plus democratic contestation.',
        definitions: [
          {
            term: 'Institutions',
            definition:
              'The rules that influence the strategies of state and social actors; a definition must contain (1) rules and (2) the behavior/strategies they structure.',
          },
          {
            term: 'New institutional economics vs. new institutionalism (political science)',
            definition:
              'NIE counts both formal (written) and informal (unwritten norms/values) rules; political-science institutionalism limits institutions mainly to formal political rules, relegating informal norms to political culture.',
          },
          {
            term: 'Parchment institutions',
            definition:
              'John Carey’s term for formal political-science institutions: rules written down as laws, regulations, constitutions, and treaties.',
          },
          {
            term: 'Political institutions',
            definition:
              'Institutions concerned with making, implementing, and adjudicating policies binding on all members of a polity (in a democracy, including access to contest those policies); covers the three branches, bureaucracy/coercive/regulatory apparatuses, local governments, constitutional bodies, plus representation/contestation mechanisms such as the party system and electoral system.',
          },
          {
            term: 'Institutionalization of formal rules',
            definition:
              'High when informal norms and values are aligned with formal rules; low when there is a significant gap or outright conflict between them.',
          },
        ],
        keyArguments: [
          'The paper adopts the rules-plus-strategies definition of institutions shared across Carey, North, Elster, Goodin, and others (PDF p. 2).',
          'It deliberately jettisons NIE’s equal weight on informal rules because that equal stress would make the political-science institutional approach lose its analytical purpose: stressing the effects of formal political rules on political, economic, and social life (PDF pp. 2-3).',
          'The constitution holds the most basic formal rules (nature of the state, relations among state organs, state-citizen relations); below it sit legislation, policies, the legal system, contracts, and organizational by-laws (PDF p. 2).',
          'Political institutions combine stateness (binding decisions), government (law-making/implementing/interpreting organs), and politics (struggle over who makes or influences binding policies) (PDF p. 3).',
        ],
        scholars: [
          { name: 'Douglass North', contribution: 'NIE definition of institutions as formal plus informal rules; constitution as the most basic formal rules.' },
          { name: 'John Carey', contribution: 'Coined analytical language of formal rules as “parchment institutions”; electoral-system and constitutional-design scholarship.' },
          { name: 'James March and Johan Olsen', contribution: '“New institutionalism” statement confining political-science institutionalism largely to formal rules.' },
          { name: 'Karen Remmer', contribution: 'Cited for political-science institutionalism confining institutions to formal rules and for the “black box” institutional analysis can open.' },
          { name: 'Guillermo O’Donnell', contribution: 'Representation/contestation mechanisms including ad hoc bodies such as parts of the electoral system and liaison committees.' },
        ],
        examples: [
          'Philippine presidential-democracy ensemble: executive departments and line agencies, Congress, Supreme Court and lower courts, local governments, constitutional bodies.',
          'Representation mechanisms with continuous organizational existence (party system, legislative committee system, consultative bodies) vs. ad hoc expression (electoral-system parts, liaison committees).',
        ],
        takeaways: [
          'Exam anchor: institutions = rules + the strategies they structure.',
          'Pilapil’s key move is narrowing institutions to formal political rules to preserve analytical focus, while still studying their interplay with informal rules, classes, and elites.',
        ],
        readingTimeMinutes: 8,
      },
      {
        id: 't-pilapil-s2',
        title: 'Why political institutions matter: incentives, constraints, and outcomes',
        summary:
          'Political institutions induce different actor strategies (time horizons; patterns of representation and contestation) and different probability distributions of outcomes (organized uncertainty in democracies; constitutional-change rules), illustrated through dictatorship-vs-democracy, presidential-vs-parliamentary, and SMD-vs-PR comparisons.',
        definitions: [
          {
            term: 'Time horizon',
            definition:
              'Actors’ temporal political cost-benefit calculation: their ability to factor in future costs and benefits of following today’s rules; longer horizons mean more willingness to play by the rules.',
          },
          {
            term: 'Organized uncertainty',
            definition:
              'Przeworski’s characterization of democracy: electoral-competition rules allow that incumbents may lose and the opposition may win, unlike predetermined authoritarian outcomes.',
          },
          {
            term: 'SMD vs. PR electoral systems',
            definition:
              'Single-member-district majoritarian systems tend toward a virtual two-party system, direct accountability, clearer lines of choice, and governability; proportional-representation systems tend toward multiparty inclusion, more accurate seats-to-votes reflection, less zero-sum competition, and (especially with closed lists) more disciplined parties.',
          },
          {
            term: 'Institutional design',
            definition:
              'Differences in inter- and intra-regime institutional features; the premise that differences in design make a difference in a nation’s politics.',
          },
        ],
        keyArguments: [
          'Different political institutions (1) induce different political strategies and (2) produce different probability distributions of political outcomes (PDF p. 4).',
          'Democracy lengthens time horizons by lowering the costs of losing (no jail/death, next election in a few years); rules seen as fair induce compliance (PDF p. 4).',
          'Parliamentary government is claimed to avoid lame-duck executive-legislative stalemate via no-fixed-term confidence rule, but critics reply parliamentary government-formation instability can shorten horizons instead, making the presidential fixed term potentially stabilizing (PDF pp. 4-5).',
          'Electoral-system type shapes accountability, transparency, governability, executive-legislative relations, party-system type, cohesion/discipline, and inclusiveness; PR effects further depend on threshold, district size/magnitude, and closed vs. open lists (PDF pp. 5-6).',
          'Constitutional-change rules show how intra-democratic design differences alter outcome probabilities: success depends on conjunctural, structural, and purposive-actor factors mobilized around the rules baseline (PDF p. 6).',
        ],
        scholars: [
          { name: 'Adam Przeworski', contribution: 'Time horizon, fairness/effectivity rewards for compliance, and “organized uncertainty” as the minimalist marker of democracy.' },
          { name: 'Juan Linz', contribution: 'Presidential-vs-parliamentary debate on deadlock and democratic performance.' },
          { name: 'Scott Mainwaring and Matthew Shugart', contribution: 'Institutional configuration argument: institutions must never be analyzed independently of one another (e.g., electoral rules vs. presidential powers).' },
          { name: 'Stephan Haggard and Robert Kaufman', contribution: 'Institutions affect actor strategies and capabilities and thus the likelihood of achieving objectives; probability distributions of outcomes.' },
          { name: 'Pablo Spiller and Mariano Tommasi', contribution: 'Institutional features of democracy and their effects on actors’ time horizons.' },
        ],
        examples: [
          'Authoritarian regimes shorten horizons: losing can mean limb, liberty, or life, so opposition must change or undermine rules (liberalization/democratization vs. polarization).',
          'Presidential fixed terms lengthen opposition horizons vs. a life-tenure dictator, but lame-duck stalemate can shorten them vs. parliamentary confidence removal.',
          'Dictatorship pressures underground/extra-legal struggle and issue polarization; democracy pressures open electoral struggle and catch-all approaches.',
        ],
        takeaways: [
          'Two effects to memorize: strategies (horizons, representation/contestation) and outcome probabilities.',
          'Design details decide: form of government, electoral formula, and amendment rules each move horizons and win probabilities.',
        ],
        readingTimeMinutes: 10,
      },
      {
        id: 't-pilapil-s3',
        title: 'Institutional blindness: society-based approaches to the Philippine state',
        summary:
          'Pilapil charges the dominant frameworks — Marxist semi-colonial/semi-feudal class analysis, Migdalian strong-society/weak-state, Weberian neopatrimonial, and hybrids — with treating political institutions as epiphenomena of social forces and ignoring how democratic institutional design mediates post-1986 Philippine politics.',
        definitions: [
          {
            term: 'Society-based approach',
            definition:
              'Any framework explaining state policies by the configuration of social forces (class, society, elites, interest groups, social movements); political institutions, if visible at all, are treated as epiphenomena.',
          },
          {
            term: 'Institutional blindness',
            definition:
              'Pilapil’s charge that dominant Philippine-politics frameworks downplay or ignore how the design of democratic political institutions affects politics.',
          },
          {
            term: 'Neopatrimonial state approach',
            definition:
              'Framework explaining state policies by elite power over the state or extent of oligarchic predation; Pilapil argues it resembles society-centered analysis in its neglect of democratic institutional mediation.',
          },
          {
            term: 'Social permeation',
            definition:
              'The process by which social forces (class, elites, groups, movements) penetrate and shape the state; Pilapil insists institutional design plays a major role in it.',
          },
        ],
        keyArguments: [
          'All four families share one unifying thread despite their differences: state policies are explained by social-force configuration, so studying institutions is deemed unworthy of sustained focus (PDF p. 7).',
          'The semi-colonial/semi-feudal view makes regime and institutional type irrelevant: whether “US-Marcos” dictatorship or “US-Aquino” democracy, the mode of production determines the state, and institutions are barriers dominant classes jump across or tunnel under (PDF p. 7).',
          'The Migdalian application glosses over authoritarian-vs-democratic regime differences and intra-regime institutional variation; McCoy’s call for elite-family historiography moves away from Western-type institutions (PDF p. 7).',
          'The neopatrimonial approach stresses authoritarian-democratic continuities and rich typologies of oligarchic predation while neglecting democratic institutional mediation; Hutchcroft’s starting point (begin with social interests acting on a dependent state) exemplifies the bias (PDF pp. 7-8).',
          'Hybrid approaches enrich the actor list (civil society, globalization, masses) but remain society-based and advance little on how specific institutional design shapes dynamics (PDF p. 8).',
        ],
        scholars: [
          { name: 'Jose Ma. Sison', contribution: 'Semi-colonial/semi-feudal determination of the Philippine state; dismisses parties and elections as comprador-landlord trappings.' },
          { name: 'Joel Migdal', contribution: 'Strong societies/weak states framework; acknowledged weakness on regime-type effects that PH applications did not pursue.' },
          { name: 'Alfred McCoy', contribution: 'Migdalian application to PH: elite-family historiography (“An Anarchy of Families”) decentering formal institutions.' },
          { name: 'Paul Hutchcroft', contribution: 'Neopatrimonial analysis of the Philippine state as dependent actor; start analysis from social interests acting upon it.' },
          { name: 'Benedict Kerkvliet / Joel Rocamora / civil-society scholars', contribution: 'Hybrid expansions of actors (NGOs, bosses, social movements) that remain institutionally blind in Pilapil’s account.' },
        ],
        examples: [
          'Sison’s equivalence of the “US-Marcos regime” and “US-Aquino regime” regardless of dictatorship-vs-democracy rules.',
          'National democrats’ lack of institutional theory even after Bayan Muna (2001) exposed a flawed marginal party-list design.',
          'Post-EDSA rules left untheorized: executive authority, party systems, electoral competition, civil-military relations, and bodies governing intra-state, state-society, and state-global relations.',
        ],
        takeaways: [
          'Diagram 1 logic: state = configuration of social forces; institutions are invisible.',
          'Exam move: name the shared flaw across all four schools before contrasting Pilapil’s alternative.',
        ],
        readingTimeMinutes: 9,
      },
      {
        id: 't-pilapil-s4',
        title: 'Institutional seeing: the state as an ensemble of institutions',
        summary:
          'The alternative: see the state as an ensemble of political institutions that mediate state-society, state-economy, and state-external relations, ask how institutional design promotes or hinders social-force effects on policy, and thereby deliver answers more holistic (the missing link) and more detailed (rules-level) than society-based accounts.',
        definitions: [
          {
            term: 'State as an ensemble of institutions',
            definition:
              'Pilapil’s Diagram 2: the state is neither a single actor nor a single institution but a bundle of political institutions in which institutional design is a major factor in social permeation.',
          },
          {
            term: 'Institutions as mediating mechanisms',
            definition:
              'Pilapil’s Diagram 3: rules sit between state and society with different absorbing/deflecting rates for social, economic, and political demands plus external shocks, so demands are not automatically translated into policy.',
          },
          {
            term: 'Central research question (institutional)',
            definition:
              'How does the design of political institutions promote or hinder the effects of class domination/fragmentation, elite predation/strength, or civil-society exclusion/empowerment on Philippine state policies?',
          },
          {
            term: 'Institutional configuration',
            definition:
              'Sensitivity to institutions’ effects on each other (e.g., congressional electoral rules undermining or strengthening presidential powers); institutions must never be analyzed in isolation.',
          },
        ],
        keyArguments: [
          'The state may indeed be a class/elite instrument, an arena of contestation, or a site of predation — but it must also be understood as mediating institutions shaping those very processes (PDF p. 8).',
          'Social-force power is itself a function of institutional mechanisms: form of government, electoral/party/legislative/judicial design intimately shape strategies and permeation; are elites strong, or have rules allowed them to be so? (PDF p. 8).',
          'Institutions mediate within and among state-society, state-economy, and state-external arenas, and also mediate state effects on society through policies and reform programs (PDF p. 6).',
          'More holistic: taking political institutions as seriously as state and society supplies the missing link tying them together; more detailed: analysis must trace how specific rule details magnify or mute non-institutional factors, opening the “black box” (PDF pp. 8-9).',
        ],
        scholars: [
          { name: 'Guillermo O’Donnell', contribution: 'Institutions as the crucial mediating/aggregating level between structural factors and organized interests; six functions of institutional settings.' },
          { name: 'Scott Mainwaring', contribution: 'Two rationales for institutionalism: institutions are more than societal expression (relative autonomy of politics) and are major shapers of political life.' },
          { name: 'Barbara Geddes', contribution: 'Different absorbing/deflecting rates of institutions for demands; initiation of new democratic institutions.' },
          { name: 'Stephan Haggard', contribution: 'Social demands are not automatically translated into policies; mediation through state policies and reform programs.' },
        ],
        examples: [
          'Table 1 contrast: society-based “how do social forces affect policy?” vs. institutional “how does design promote/hinder those effects?”',
          'Elite parties as disposable elite-clan alliances: instead of stopping at families, ask what role electoral-system design played in making parties weak (Coronel et al.’s Rulemakers documents the rulers; institutionalism must study the rules).',
          'Reform cascade: party-type choice forces electoral-system choice, which forces PR details (party-list type, threshold/ceiling, district size) to expand participation without sacrificing governability.',
        ],
        takeaways: [
          'Ask the institutional question first, then trace rules × structure × interests × strategies.',
          'Holistic-through-narrowing is the paradox to quote: finer rule details yield the bigger picture.',
        ],
        readingTimeMinutes: 9,
      },
      {
        id: 't-pilapil-s5',
        title: 'Institutionalism at work: charter change, comparison, and reform details',
        summary:
          'Pilapil surveys 1990s-2000s institutionalist work — the presidential-vs-parliamentary charter-change debate, Torres/Rüland rebuttals, and Croissant/MacIntyre comparisons via veto players and political architecture — then closes with a call for theoretical and empirical work on institutional reform, warning that rules produce unexpected outcomes.',
        definitions: [
          {
            term: 'Veto players',
            definition:
              'Tsebelis’s concept: the number of actors that can block policy change across the political system; used with proactive (agenda/decree) vs. reactive (veto) presidential powers.',
          },
          {
            term: 'National political architecture',
            definition:
              'MacIntyre’s term for the complex totality of a country’s basic political institutions; configurations severely centralizing power risk policy volatility, severely fragmenting ones risk policy rigidity.',
          },
          {
            term: 'Delegative democracy',
            definition:
              'O’Donnell’s concept: presidents riding roughshod over legislatures and courts; Croissant tests it for the Philippines vs. South Korea.',
          },
          {
            term: 'Unintended consequences of rules',
            definition:
              'Pilapil’s caution (via Elster): designers miscalculate; e.g., the 1987 single-term rule, meant to prevent another Marcos, became an incentive to tinker with succession rules.',
          },
        ],
        keyArguments: [
          'The charter-change debate, despite crude pro-parliamentary caricatures, produced a rudimentary discourse on institutional design: proponents established form-of-government effects on executive-legislative and party dynamics, skeptics established intra-form variation and overall institutional configuration (PDF pp. 10-11).',
          'Croissant turns alleged pathologies into virtues: weak Philippine presidential proactive powers plus many veto players secure separation of powers and horizontal accountability, unlike South Korea’s at-times “hyper-presidential” government (PDF p. 11).',
          'MacIntyre rates the Philippines “moderately fragmented”: satisfactory-if-messy crisis response vs. Thai rigidity and Malaysian/Indonesian volatility, with the failed 1997 charter bid explained by fears of dangerous centralization (PDF pp. 11-12).',
          'Closing agenda: move beyond exploratory work into theory (especially institutional reform) and empirical study, since charter change may force scholars to confront how design shapes both self-interested politicians and programmatic reformers (PDF p. 12).',
        ],
        scholars: [
          { name: 'Crisline Torres', contribution: 'Reviewed the pro-parliamentary critique and the comparative constitutional-design literature; rebutted parliamentary superiority claims.' },
          { name: 'Jürgen Rüland', contribution: 'Constitutional-debates article challenging Filipino parliamentary advocates with institutional-design arguments.' },
          { name: 'Aurel Croissant', contribution: 'Compared Philippine and South Korean presidentialism via legislative powers and veto players; delegative-democracy test.' },
          { name: 'Andrew MacIntyre', contribution: 'Four-country veto-player/political-architecture comparison rating PH moderately fragmented; volatility-vs-rigidity thesis.' },
          { name: 'George Tsebelis', contribution: 'Veto-players framework underlying Croissant and MacIntyre.' },
          { name: 'Jose Abueva and pro-parliamentary advocates', contribution: 'Federal-parliamentary campaign literature (Abueva/Santos volumes) drawing on institutional-design arguments.' },
        ],
        examples: [
          '2006 campaign to shift the presidential system to parliamentarism; Abueva-edited federal-parliamentary reader and Santos et al. Shift vs. Torres/Rüland rebuttals.',
          'American-period sequencing: SMD elections from municipal to national levels projected local elite clans into national politics and stunted a meritocratic civil-service elite.',
          '1987 single-term presidency: Ramos-era (1996-97 cha-cha) and Estrada-era (1999-2000 concord) tinkering incentives; Arroyo 2001-04 differed only because she could run in 2004.',
          '1997 Asian financial crisis: Thailand debilitating rigidity, Malaysia/Indonesian volatility, Philippines intermediate pattern.',
        ],
        takeaways: [
          'Comparative angle: Philippine institutions look less pathological against Thailand, Korea, Malaysia, and Indonesia.',
          'Reform moral: the devil is in the details — every general fix (PR, parliamentarism) dissolves into finer-point choices with surprise effects.',
        ],
        readingTimeMinutes: 10,
      },
    ],
  },
];

export const topicById = (id: string): Topic | undefined =>
  topics.find((t) => t.id === id);
