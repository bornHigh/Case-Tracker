/* CaseFlow Arcane — Oracle Engine (Metric-Aware Prophecies, Voices & Arcane Manifestation)
 * Purely local browser execution; no external APIs, runtime AI, or extra timers. */
(function (global) {
  'use strict';

  // Keep a small rolling history of recent prophecy lines so the Oracle avoids repeating itself
  const RECENT_LIMIT = 10;
  const recentKeys = [];
  let lastCacheKey = null;
  let lastRenderedMarkup = null;

  // Oracle voice definitions and lines grouped by performance state
  const PERSONALITIES = {
    ancient_oracle: {
      id: 'ancient_oracle',
      name: 'Ancient Oracle',
      openers: [
        'The High Astrolabe reads the omen:',
        'Across the turning spheres, it is foretold:',
        'The oldest ink on the scroll trembles:',
        'Before the stars cool, the ledger speaks:'
      ],
      empty: [
        'The parchment lies unscarred and silent; no mortal deeds yet stain the stars.',
        'Blank vellum awaits its first trial—neither glory nor ruin has been written.'
      ],
      partial: [
        'Partial threads glimmer in the glass; half the omen remains veiled from sight.',
        'Only fragments of the ledger answer; speak more trials to complete the reading.'
      ],
      forfeited: [
        'CSAT has fallen below 75%—the whole coffer turns to ash and every boon is forfeit.',
        'A shattered truce below 75% CSAT severs the treasure line; all gold slips into void.'
      ],
      penalty_aht: [
        'Average handle time drags past 32 minutes; the €50 toll claims its heavy price.',
        'Time stretches like tar past 32m—a €50 shadow is taxed from the treasury.'
      ],
      penalty_rr: [
        'Repeat rate falls under 84%; old specters return and cost €25 from the hoard.',
        'Unfinished ghosts linger below 84% RR, bleeding €25 from the realm’s coffers.'
      ],
      combined_woes: [
        'Multiple fractures scar the ledger at once; storm clouds gather over every coin.',
        'Several trials falter together—the omen darkens before the tally can prosper.'
      ],
      approaching: [
        'A threshold hums within reach—one steady stroke can tip the balance.',
        'The mark stands close; another clean resolve may still claim the prize.'
      ],
      reward_earned: [
        'The threshold is met and gold answers the call—bounty rests within reach.',
        'A target falls cleanly in line; the ledger grants its promised tribute.'
      ],
      reward_missed: [
        'The mark slips just out of grasp; no bonus crown is claimed there.',
        'So close to the threshold, yet the coffer keeps its extra gold locked.'
      ],
      excellent: [
        'Every ward holds firm and the full €300 boon gleams across the chronicle.',
        'Rare mastery rules the ledger—triumph echoes through every measured trial.'
      ],
      poor: [
        'Heavy shadows weigh down the record; little bounty survives the present strain.',
        'The ledger groans under steep setbacks—sharp discipline is needed to turn the tide.'
      ]
    },

    dwarven_war_crier: {
      id: 'dwarven_war_crier',
      name: 'Dwarven War-Crier',
      openers: [
        'By the beard of the First King!',
        'Hoots, mon! Hear the iron horn:',
        'There’s a moose loose aboot this hoose—listen sharp!',
        'Hammer and anvil ring out:'
      ],
      empty: [
        'Empty forge, lad—no cases or monits on the slab yet. Light the coals and begin.',
        'Quiet as a closed mine. Log a case or monit before I holler at thin air.'
      ],
      partial: [
        'Half the tally’s missing from the board—don’t ask me to hammer cold iron blind.',
        'Some gauges are blank yet; bring the rest of the figures to the anvil.'
      ],
      forfeited: [
        'CSAT under 75%—ye’ve blasted the whole bonus keg to splinters! Zero gold!',
        'Below 75% CSAT and the entire bloody bonus barrel’s gone! Aye, that stings.'
      ],
      penalty_aht: [
        'AHT over 32 minutes—ye’re carving runes with a butter knife and losing €50!',
        'Past 32m AHT! Even a sleepy badger wraps up quicker than a €50 dock.'
      ],
      penalty_rr: [
        'RR under 84%—the same bloody beasts keep crawling back for a €25 tax!',
        'Below 84% RR means fighting the same troll twice and surrendering €25.'
      ],
      combined_woes: [
        'Two or three alarms ringing at once—tighten yer belt before the whole hall groans!',
        'Multiple metrics taking a beating; steady the line and stop the bleeding.'
      ],
      approaching: [
        'Right on the doorstep of the mark—give it one last heave and claim it!',
        'Close enough to smell the ale—keep your nerve and cross the line.'
      ],
      reward_earned: [
        'Aye, that target’s battered flat—good coin earned for honest work!',
        'Threshold cleared! That’s proper gold clinking into the pouch.'
      ],
      reward_missed: [
        'Missed the mark by a hair—no extra gold for near-misses in the mountain.',
        'Short of the tier line; the bonus stays bolted behind iron.'
      ],
      excellent: [
        'By the First King, the whole hall’s singing—strong numbers across the board!',
        'Clean work, stout pace, and solid marks—raise a mug to a proper run!'
      ],
      poor: [
        'Rougher than a gravel stew—several numbers are taking a proper thrashing.',
        'The ledger’s looking battered; time to rally and clean up the mess.'
      ]
    },

    royal_inquisitor: {
      id: 'royal_inquisitor',
      name: 'Royal Inquisitor',
      openers: [
        'The Court of Inquiry observes:',
        'Your file is reviewed under strict protocol:',
        'A formal notation from the High Chancery:',
        'The magistrate’s quill pauses here:'
      ],
      empty: [
        'An unwritten docket presents no evidence—either for commendation or censure.',
        'No entries appear on the record; judgment is reserved until cases are logged.'
      ],
      partial: [
        'The dossier remains incomplete; partial records yield only a provisional note.',
        'Several metrics lack sufficient entries for a full inquisitorial finding.'
      ],
      forfeited: [
        'CSAT below 75% constitutes a total breach of standards; all bonus awards are revoked.',
        'Falling under 75% CSAT forfeits the entire bonus—a most costly lapse.'
      ],
      penalty_aht: [
        'Average handle time exceeds 32 minutes; a €50 deduction is duly entered.',
        'Lingering past 32m AHT incurs a €50 penalty—brevity is a civic virtue.'
      ],
      penalty_rr: [
        'Repeat rate beneath 84% betrays unresolved work, exacting a €25 deduction.',
        'Below 84% RR points to recurring defects and a €25 reduction in payout.'
      ],
      combined_woes: [
        'Compound deficiencies appear across the ledger; excuses will not balance the books.',
        'Multiple thresholds stand breached simultaneously—the record demands correction.'
      ],
      approaching: [
        'You stand near the threshold, yet proximity is not compliance—finish cleanly.',
        'Within striking distance of the standard; precision now determines the outcome.'
      ],
      reward_earned: [
        'The required standard is satisfied and the corresponding award is duly credited.',
        'Compliance meets the threshold; a rightful bonus tier is secured.'
      ],
      reward_missed: [
        'The bonus threshold was not achieved; the ledger records no reward for this line.',
        'Short of the qualifying mark—the higher tier remains ungranted.'
      ],
      excellent: [
        'Exemplary standing across the board—the ledger reflects rare order and precision.',
        'High standards upheld throughout; the court notes a commendably strong record.'
      ],
      poor: [
        'Substandard performance mars the docket; corrective action is plainly overdue.',
        'Repeated shortfalls weaken the standing of this chronicle.'
      ]
    },

    battle_commander: {
      id: 'battle_commander',
      name: 'Battle Commander',
      openers: [
        'Frontline report from the war room:',
        'Hold formation and hear the dispatch:',
        'Vanguard assessment on the current campaign:',
        'Eyes on the objective—here is the sitrep:'
      ],
      empty: [
        'The sector is quiet and no troops have engaged yet; deploy your first entries.',
        'No battle log recorded yet. Stand ready and log your first engagement.'
      ],
      partial: [
        'Scouts report incomplete intelligence; several sectors have yet to report in.',
        'Partial telemetry on the map—push more data through before calling victory.'
      ],
      forfeited: [
        'CSAT under 75%—we lost the flank and forfeited the entire bonus payout.',
        'A drop below 75% CSAT wipes out the bonus reserve; lock down client outcomes.'
      ],
      penalty_aht: [
        'AHT over 32 minutes bogs down the advance and costs €50 in momentum.',
        'Dragging past 32m AHT stalls the push—cut the delay and save the €50.'
      ],
      penalty_rr: [
        'RR below 84% means enemies keep rallying—another €25 lost to unfinished work.',
        'Below 84% RR lets resolved issues return; finish them clean or pay €25.'
      ],
      combined_woes: [
        'Multiple fronts are under pressure at once—regroup and hit the weakest line first.',
        'Several metrics are flashing red; tighten execution across every sector.'
      ],
      approaching: [
        'Closing in on the objective—keep pushing and don’t stall short of the line.',
        'Right near the target mark; finish strong and take the ground.'
      ],
      reward_earned: [
        'Objective secured! That metric cleared the line and earned its bonus ground.',
        'Strong execution on that front—the bonus reward is won.'
      ],
      reward_missed: [
        'Fell short of the bonus line—no extra reward taken on that sector.',
        'Close fight, but the threshold held; regroup for the next push.'
      ],
      excellent: [
        'Disciplined execution across the line—strong standing and full command.',
        'The campaign is running sharp—high marks across the board.'
      ],
      poor: [
        'Heavy casualties on the scorecard—too many metrics are bleeding ground.',
        'The line is strained; sharpen your pace and close out cases cleanly.'
      ]
    },

    cosmic_entity: {
      id: 'cosmic_entity',
      name: 'Cosmic Entity',
      openers: [
        'A fleeting pulse from beyond the nebula:',
        'Between one star’s birth and another’s drift:',
        'An ancient tide ripples through the glass:',
        'From vast, indifferent light:'
      ],
      empty: [
        'Nothing yet stirs in this tiny ledger; galaxies turn without a single logged case.',
        'A blank expanse of numbers—neither spark nor shadow has formed yet.'
      ],
      partial: [
        'Only scattered glints appear in the dark; much of the picture remains unformed.',
        'Incomplete signals drift across the void—more data is needed to read the pattern.'
      ],
      forfeited: [
        'CSAT below 75% dissolves the entire bonus—a brief flare extinguished in seconds.',
        'Under 75% CSAT, the whole bonus vanishes like smoke in stellar wind.'
      ],
      penalty_aht: [
        'Past 32m AHT, a minute feels like an epoch—and €50 drifts away.',
        'Handle time stretches past 32m, shedding €50 into the quiet dark.'
      ],
      penalty_rr: [
        'Below 84% RR, echoes repeat endlessly, costing €25 from the tally.',
        'Recurring cases below 84% RR wear down the ledger by €25.'
      ],
      combined_woes: [
        'Several threads fray at once, dimming the tally across multiple fronts.',
        'Multiple faults align in the same cycle; the pattern leans heavy.'
      ],
      approaching: [
        'A threshold shimmers just ahead—barely a breath away from crossing.',
        'Near the boundary line; one more step completes the shift.'
      ],
      reward_earned: [
        'A threshold is crossed and a bonus spark ignites within the ledger.',
        'The condition aligns; a reward tier settles onto the tally.'
      ],
      reward_missed: [
        'The boundary passes untouched—no bonus spark is granted there.',
        'Just shy of the mark; the extra payout stays out of reach.'
      ],
      excellent: [
        'Rare alignment across the metrics—a bright span in a vast, quiet cosmos.',
        'All measured threads hold steady; the ledger shines at full strength.'
      ],
      poor: [
        'Dim numbers and heavy drag mark this cycle—far from stellar form.',
        'The record runs low across key metrics; much ground lies unrecovered.'
      ]
    },

    goblin_accountant: {
      id: 'goblin_accountant',
      name: 'Goblin Accountant',
      openers: [
        'Oi! Count the coins carefully:',
        'The tally-stick clicks and clacks:',
        'I’ve checked every copper and gold piece:',
        'Listen close—the pouch tells all:'
      ],
      empty: [
        'No cases or monits yet—pouch is untouched and the ledger’s clean as bone.',
        'Empty book, zero coins moved. Log some work so I have numbers to count.'
      ],
      partial: [
        'Half-baked figures! Some metrics have no data yet, so don’t expect full math.',
        'Missing entries leave gaps in the calculation—feed the ledger proper numbers.'
      ],
      forfeited: [
        'CSAT under 75%?! Poof—every last bonus coin gone! Don’t cry to me!',
        'Below 75% CSAT wipes out the whole bonus! That’s brutal arithmetic.'
      ],
      penalty_aht: [
        'AHT over 32m—boom, minus €50! Slow hands cost real gold!',
        'Past 32m AHT shaves €50 straight off the top. Speed up or pay up!'
      ],
      penalty_rr: [
        'RR below 84%—minus €25! Fix ’em once so they stop gnawing the gold!',
        'Under 84% RR triggers a €25 penalty. Stop letting cases bounce back!'
      ],
      combined_woes: [
        'Ooh, bad math stacking up—multiple penalties and misses biting the payout!',
        'Several hits at once! The bonus pot is getting chewed from every side.'
      ],
      approaching: [
        'Right next to a payout line—don’t fumble it before the tally locks!',
        'So close to a bonus bump—one clean push could mean extra coin.'
      ],
      reward_earned: [
        'Cha-ching! Threshold cleared—that’s real bonus gold earned!',
        'Nice! You hit the mark and unlocked a tidy slice of bonus.'
      ],
      reward_missed: [
        'Missed the bonus line—no extra gold for "almost," cheeky mortal!',
        'Just short of the threshold; the extra coin stays right where it is.'
      ],
      excellent: [
        'Look at those clean numbers—top marks and the full €300 pot in sight!',
        'Every metric firing right—best kind of math there is!'
      ],
      poor: [
        'Ouch—weak scores and heavy drag are starving the bonus pot.',
        'Not pretty math—several numbers are lagging behind target.'
      ]
    }
  };

  const PERSONALITY_KEYS = Object.keys(PERSONALITIES);

  // Pick a random element from a non-empty array
  function pickFrom(arr) {
    if (!Array.isArray(arr) || !arr.length) return '';
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // Pick a line while avoiding entries recently used in the rolling window
  function pickNonRepeating(candidates, keyPrefix) {
    const list = Array.isArray(candidates) && candidates.length ? candidates : [''];
    const fresh = list.filter((text, idx) => !recentKeys.includes(`${keyPrefix}:${idx}:${text}`));
    const pool = fresh.length ? fresh : list;
    const chosen = pickFrom(pool);
    const actualIdx = list.indexOf(chosen);
    const entryKey = `${keyPrefix}:${actualIdx}:${chosen}`;
    const existingPos = recentKeys.indexOf(entryKey);
    if (existingPos !== -1) recentKeys.splice(existingPos, 1);
    recentKeys.push(entryKey);
    while (recentKeys.length > RECENT_LIMIT) recentKeys.shift();
    return chosen;
  }

  // Check whether a numeric value sits within a given distance of a target
  function isNear(val, target, tolerance) {
    return typeof val === 'number' && !isNaN(val) && Math.abs(val - target) <= tolerance;
  }

  // Build a stable identifier for the active chronicle tab
  function getTabIdentity(tab) {
    if (!tab) return 'no-tab';
    if (tab.id !== undefined && tab.id !== null && String(tab.id).trim() !== '') {
      return String(tab.id);
    }
    return `name:${tab.name || ''}`;
  }

  // Quantize a numeric metric cleanly so tiny rounding steps do not hide threshold crossings
  function quantizeMetric(val) {
    if (val === null || val === undefined || typeof val !== 'number' || isNaN(val)) return null;
    return Number(val.toFixed(4));
  }

  // Encode threshold and penalty boundary states so any boundary transition invalidates cache
  function buildThresholdState(metrics) {
    const m = metrics || {};
    return {
      csatTier: m.csatPct === null || m.csatPct === undefined || isNaN(m.csatPct)
        ? 'none'
        : m.csatPct < 75 ? 'forfeit' : m.csatPct < 89 ? 'below89' : m.csatPct < 94 ? 'tier100' : 'tier180',
      crtTier: m.crtPct === null || m.crtPct === undefined || isNaN(m.crtPct)
        ? 'none'
        : m.crtPct >= 94 ? 'met94' : 'below94',
      rrTier: m.rrPct === null || m.rrPct === undefined || isNaN(m.rrPct)
        ? 'none'
        : m.rrPct < 84 ? 'penalty' : 'ok',
      ahtTier: m.avgAht === null || m.avgAht === undefined || isNaN(m.avgAht)
        ? 'none'
        : m.avgAht > 32 ? 'penalty' : 'ok',
      qualTier: m.avgQual === null || m.avgQual === undefined || isNaN(m.avgQual)
        ? 'none'
        : m.avgQual >= 90 ? 'met90' : 'below90'
    };
  }

  // Build a high-precision snapshot of counts, metric values, tiers, and payout fields
  function buildSnapshot(tab, metrics) {
    const cases = Array.isArray(tab && tab.cases) ? tab.cases : [];
    const audits = Array.isArray(tab && tab.qaAudits) ? tab.qaAudits : [];
    const m = metrics || {};
    return JSON.stringify({
      c: cases.length,
      q: audits.length,
      csat: quantizeMetric(m.csatPct),
      crt: quantizeMetric(m.crtPct),
      rr: quantizeMetric(m.rrPct),
      aht: quantizeMetric(m.avgAht),
      qual: quantizeMetric(m.avgQual),
      csatBonus: m.csatBonus || 0,
      crtBonus: m.crtBonus || 0,
      qualBonus: m.qualBonus || 0,
      ahtPenalty: m.ahtPenalty || 0,
      rrPenalty: m.rrPenalty || 0,
      penalty: m.penalty || 0,
      bonus: m.totalBonus || 0,
      forfeited: Boolean(m.forfeited),
      tiers: buildThresholdState(m)
    });
  }

  // Combine tab identity and precise metric snapshot into the prophecy cache key
  function buildCacheKey(tab, metrics) {
    return `${getTabIdentity(tab)}::${buildSnapshot(tab, metrics)}`;
  }

  // Classify overall performance band from forfeiture, data completeness, and actual problems
  function deriveOverallBand(category, metrics, definedCount, options) {
    const opts = options || {};
    const count = typeof definedCount === 'number' && !isNaN(definedCount) ? definedCount : 0;

    // Forfeiture always overrides all other states as catastrophic
    if (metrics && metrics.forfeited) {
      return 'catastrophic';
    }

    // Fewer than 5 defined metrics cannot support a full overall performance verdict
    if (count < 5) {
      return 'indeterminate';
    }

    if (category === 'excellent') {
      return 'excellent';
    }

    // Multiple active woes or severe problems indicate poor standing
    if (category === 'poor' || category === 'penalty_aht' || category === 'penalty_rr' || category === 'combined_woes') {
      return 'poor';
    }

    if (opts.hasSevereWoe || (typeof opts.woeCount === 'number' && opts.woeCount >= 2)) {
      return 'poor';
    }

    // Earned bonus with no penalties or missed thresholds indicates good standing
    if (category === 'reward_earned') {
      return 'good';
    }

    // Approaching a threshold or missing a single reward tier without penalties is borderline
    if (category === 'approaching' || category === 'reward_missed' || opts.hasApproaching) {
      return 'borderline';
    }

    return 'borderline';
  }

  /* Interpret KPI metrics without altering computeMetrics() or inventing missing numbers. */
  function analyzePerformance(tab, metrics) {
    const cases = Array.isArray(tab && tab.cases) ? tab.cases : [];
    const audits = Array.isArray(tab && tab.qaAudits) ? tab.qaAudits : [];
    const hasAnyData = cases.length > 0 || audits.length > 0;
    const snapshot = buildSnapshot(tab, metrics);

    const definedCount = [
      metrics.csatPct,
      metrics.crtPct,
      metrics.rrPct,
      metrics.avgAht,
      metrics.avgQual
    ].filter(v => v !== null && v !== undefined && !isNaN(v)).length;

    // 1. Handle empty or zero-metric states first
    if (!hasAnyData || definedCount === 0) {
      return {
        category: 'empty',
        overallBand: deriveOverallBand('empty', metrics, definedCount),
        severity: 'neutral',
        focusMetric: null,
        snapshot
      };
    }

    // 2. Forfeiture (<75% CSAT) takes highest priority
    if (metrics.forfeited) {
      return {
        category: 'forfeited',
        overallBand: deriveOverallBand('forfeited', metrics, definedCount),
        severity: 'high',
        focusMetric: 'csat',
        snapshot
      };
    }

    // 3. Collect active penalties and missed bonus thresholds
    const woes = [];
    if (metrics.ahtPenalty > 0) woes.push({ metric: 'aht', type: 'penalty_aht', weight: 3 });
    if (metrics.rrPenalty > 0) woes.push({ metric: 'rr', type: 'penalty_rr', weight: 2 });
    if (metrics.csatPct !== null && metrics.csatPct < 89) {
      woes.push({ metric: 'csat', type: 'reward_missed', weight: 2 });
    }
    if (metrics.crtPct !== null && metrics.crtPct < 94) {
      woes.push({ metric: 'crt', type: 'reward_missed', weight: 1 });
    }
    if (metrics.avgQual !== null && metrics.avgQual < 90) {
      woes.push({ metric: 'sqs', type: 'reward_missed', weight: 1 });
    }

    const earnedRewards = [];
    if (metrics.csatBonus > 0) earnedRewards.push({ metric: 'csat', amount: metrics.csatBonus });
    if (metrics.crtBonus > 0) earnedRewards.push({ metric: 'crt', amount: metrics.crtBonus });
    if (metrics.qualBonus > 0) earnedRewards.push({ metric: 'sqs', amount: metrics.qualBonus });

    // Identify metrics sitting just short of or right near a threshold
    const approaching = [];
    if (metrics.csatPct !== null && metrics.csatPct < 94 && isNear(metrics.csatPct, 94, 3)) {
      approaching.push({ metric: 'csat', detail: `${metrics.csatPct.toFixed(1)}% vs 94%` });
    } else if (metrics.csatPct !== null && metrics.csatPct < 89 && isNear(metrics.csatPct, 89, 3)) {
      approaching.push({ metric: 'csat', detail: `${metrics.csatPct.toFixed(1)}% vs 89%` });
    }
    if (metrics.crtPct !== null && metrics.crtPct < 94 && isNear(metrics.crtPct, 94, 3)) {
      approaching.push({ metric: 'crt', detail: `${metrics.crtPct.toFixed(1)}% vs 94%` });
    }
    if (metrics.avgQual !== null && metrics.avgQual < 90 && isNear(metrics.avgQual, 90, 3)) {
      approaching.push({ metric: 'sqs', detail: `${metrics.avgQual.toFixed(1)}% vs 90%` });
    }
    if (metrics.avgAht !== null && metrics.avgAht <= 32 && isNear(metrics.avgAht, 32, 1.5)) {
      approaching.push({ metric: 'aht', detail: `${metrics.avgAht.toFixed(1)}m near 32m cap` });
    }
    if (metrics.rrPct !== null && metrics.rrPct >= 84 && isNear(metrics.rrPct, 84, 3)) {
      approaching.push({ metric: 'rr', detail: `${metrics.rrPct.toFixed(1)}% near 84% floor` });
    }

    const severeCount = woes.filter(w => w.weight >= 3).length;
    const bandContext = {
      hasApproaching: approaching.length > 0,
      woeCount: woes.length,
      hasSevereWoe: severeCount > 0
    };

    // Multiple active woes
    if (woes.length >= 2) {
      const category = 'combined_woes';
      return {
        category,
        overallBand: deriveOverallBand(category, metrics, definedCount, bandContext),
        severity: severeCount >= 2 ? 'high' : 'moderate',
        focusMetric: woes[0].metric,
        snapshot
      };
    }

    // Single active woe (penalty or missed bonus threshold)
    if (woes.length === 1) {
      const single = woes[0];
      return {
        category: single.type,
        overallBand: deriveOverallBand(single.type, metrics, definedCount, bandContext),
        severity: single.weight >= 3 ? 'high' : 'moderate',
        focusMetric: single.metric,
        snapshot
      };
    }

    // All five metrics defined and meeting healthy thresholds
    const allFiveHealthy = definedCount === 5 &&
      metrics.csatPct >= 94 &&
      metrics.crtPct >= 94 &&
      metrics.avgQual >= 90 &&
      metrics.avgAht <= 32 &&
      metrics.rrPct >= 84;

    if (allFiveHealthy) {
      return {
        category: 'excellent',
        overallBand: deriveOverallBand('excellent', metrics, definedCount, bandContext),
        severity: 'praise',
        focusMetric: 'overall',
        snapshot
      };
    }

    if (approaching.length > 0) {
      return {
        category: 'approaching',
        overallBand: deriveOverallBand('approaching', metrics, definedCount, bandContext),
        severity: 'moderate',
        focusMetric: approaching[0].metric,
        snapshot
      };
    }

    if (earnedRewards.length > 0) {
      return {
        category: 'reward_earned',
        overallBand: deriveOverallBand('reward_earned', metrics, definedCount, bandContext),
        severity: 'praise',
        focusMetric: earnedRewards[0].metric,
        snapshot
      };
    }

    if (definedCount < 5) {
      return {
        category: 'partial',
        overallBand: deriveOverallBand('partial', metrics, definedCount, bandContext),
        severity: 'neutral',
        focusMetric: null,
        snapshot
      };
    }

    return {
      category: 'poor',
      overallBand: deriveOverallBand('poor', metrics, definedCount, bandContext),
      severity: 'moderate',
      focusMetric: null,
      snapshot
    };
  }

  // Format a short metric tag when a specific metric is highlighted
  function formatMetricClause(focusMetric, metrics) {
    if (!focusMetric || focusMetric === 'overall') return '';
    if (focusMetric === 'csat' && metrics.csatPct !== null) {
      return ` [CSAT ${metrics.csatPct.toFixed(1)}%]`;
    }
    if (focusMetric === 'aht' && metrics.avgAht !== null) {
      return ` [AHT ${metrics.avgAht.toFixed(1)}m]`;
    }
    if (focusMetric === 'crt' && metrics.crtPct !== null) {
      return ` [CRT NE ${metrics.crtPct.toFixed(1)}%]`;
    }
    if (focusMetric === 'rr' && metrics.rrPct !== null) {
      return ` [RR ${metrics.rrPct.toFixed(1)}%]`;
    }
    if (focusMetric === 'sqs' && metrics.avgQual !== null) {
      return ` [SQS ${metrics.avgQual.toFixed(1)}%]`;
    }
    return '';
  }

  // Build or reuse the prophecy markup without mutating random state on cache hits
  function forgeLiveProphecy(options) {
    const opts = options || {};
    const tab = opts.tab || (typeof getActiveTab === 'function' ? getActiveTab() : null);
    if (!tab) return '“The scroll rests quiet.”';

    const m = opts.metrics || (typeof computeMetrics === 'function' ? computeMetrics(tab) : null);
    if (!m) return '“The scroll rests quiet.”';

    const cacheKey = buildCacheKey(tab, m);
    if (!opts.forceRefresh && cacheKey === lastCacheKey && lastRenderedMarkup) {
      return lastRenderedMarkup;
    }

    const analysis = analyzePerformance(tab, m);
    const pKey = PERSONALITY_KEYS[Math.floor(Math.random() * PERSONALITY_KEYS.length)];
    const persona = PERSONALITIES[pKey];

    const pool = persona[analysis.category] || persona.partial || ['The ledger shifts quietly.'];
    const line = pickNonRepeating(pool, `${pKey}:${analysis.category}`);
    const opener = analysis.category === 'empty' ? '' : `${pickNonRepeating(persona.openers, `${pKey}:open`)} `;
    const statTag = formatMetricClause(analysis.focusMetric, m);

    const quote = `“${opener}${line}${statTag}”`;
    lastCacheKey = cacheKey;
    lastRenderedMarkup = `<div class="oracle-quote-only" data-oracle-voice="${persona.id}" data-oracle-state="${analysis.category}" data-oracle-band="${analysis.overallBand}"><span class="oracle-rune-divider">✦ ─── ✦</span>${quote}<span class="oracle-rune-divider">✦ ─── ✦</span></div>`;

    return lastRenderedMarkup;
  }

  // Check whether the user prefers reduced motion
  function prefersReducedMotion() {
    return Boolean(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* Arcane Manifestation: Layered glowing runic rings, sigil core & gentle breathing animation */
  function forgeProceduralSeal() {
    const pKey = PERSONALITY_KEYS[Math.floor(Math.random() * PERSONALITY_KEYS.length)];
    const seed = Math.floor(Math.random() * 9000) + 1000;
    const uid = `manifest_${pKey}_${seed}`;
    const lobes = 6 + (seed % 5);
    const reduced = prefersReducedMotion();

    // Distribute small spark nodes evenly around the outer runic ring
    const ringNodes = [];
    for (let i = 0; i < lobes; i++) {
      const angle = (i * 2 * Math.PI) / lobes - Math.PI / 2;
      const x = (60 + 44 * Math.cos(angle)).toFixed(1);
      const y = (60 + 44 * Math.sin(angle)).toFixed(1);
      ringNodes.push(`<circle class="manifest-spark-mote" cx="${x}" cy="${y}" r="${i % 2 === 0 ? '2.1' : '1.4'}" />`);
    }

    return `
      <div class="arcane-manifestation${reduced ? ' reduced-motion' : ''}" data-manifest-seed="${seed}" aria-hidden="true">
        <div class="manifest-bloom"></div>
        <svg class="manifest-svg" viewBox="0 0 120 120">
          <defs>
            <radialGradient id="${uid}_aura" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stop-color="#991b1b" stop-opacity="0.34" />
              <stop offset="55%" stop-color="#581c87" stop-opacity="0.16" />
              <stop offset="100%" stop-color="#581c87" stop-opacity="0" />
            </radialGradient>
            <linearGradient id="${uid}_gold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#7f1d1d" />
              <stop offset="50%" stop-color="#92400e" />
              <stop offset="100%" stop-color="#581c87" />
            </linearGradient>
          </defs>

          <circle cx="60" cy="60" r="56" fill="url(#${uid}_aura)" class="manifest-layer-pulse-slow" />

          <g class="manifest-ring-outer">
            <circle cx="60" cy="60" r="51" class="manifest-ring-line" />
            <circle cx="60" cy="60" r="44" class="manifest-ring-dashed" />
            ${ringNodes.join('')}
          </g>

          <g class="manifest-ring-inner">
            <circle cx="60" cy="60" r="33" class="manifest-ring-line" />
            <polygon points="60,29 86,74 34,74" class="manifest-sigil-frame" />
            <polygon points="60,91 86,46 34,46" class="manifest-sigil-frame" />
          </g>

          <g class="manifest-core-sigil">
            <circle cx="60" cy="60" r="16" class="manifest-core-disc" />
            <path d="M60 47 L64 56 L73 60 L64 64 L60 73 L56 64 L47 60 L56 56 Z" class="manifest-core-star" />
            <circle cx="60" cy="60" r="4" class="manifest-core-gem" />
          </g>
        </svg>
      </div>`;
  }

  global.CaseFlowOracle = {
    personalities: PERSONALITIES,
    analyzePerformance,
    forgeLiveProphecy,
    forgeProceduralSeal
  };
})(window);