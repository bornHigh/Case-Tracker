/* CaseFlow Arcane — Oracle Engine (Metric-Aware Prophecies, Voices & Arcane Manifestation)
 * Purely local browser execution; no external APIs, runtime AI, or extra timers. */
(function (global) {
  'use strict';

  const RECENT_LIMIT = 24;
  const recentKeys = [];
  const recentPersonalities = [];
  let lastCacheKey = null;
  let lastRenderedMarkup = null;

  function escapeHtml(val) {
    return String(val === undefined || val === null ? '' : val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Six distinct Oracle personalities with rich, varied, metric-aware pools
  const PERSONALITIES = {
    ancient_oracle: {
      id: 'ancient_oracle',
      name: 'Ancient Oracle',
      openers: [
        'The High Astrolabe reads the omen:',
        'Across the turning spheres, it is foretold:',
        'The oldest ink on the scroll trembles:',
        'Before the stars cool, the ledger speaks:',
        'Through centuries of fallen thrones, the glass whispers:',
        'Dust from a thousand dead empires settles upon this line:',
        'The celestial astrolabe shifts its brass rings:',
        'A cold tide of ancient foresight answers:'
      ],
      empty: [
        'The parchment lies unscarred and silent; no mortal deeds yet stain the stars.',
        'Blank vellum awaits its first trial—neither glory nor ruin has been written.',
        'Before the first chronicle mark is struck, even fate holds its breath in the dark.',
        'An empty slate hangs in the void, waiting to learn what manner of mortal stands here.',
        'No petitions, no verdicts, no blood or gold upon the ledger yet—only quiet starlight.',
        'The oracle’s mirror shows only unbroken stillness where a record has yet to begin.',
        'Even the oldest prophecies start as silence before the first entry wakes the ink.',
        'A clean scroll is a fragile mercy; once written, the stars keep every reckoning.',
        'No trial has tested the scales yet, and the ancient watchers wait in patient shadow.',
        'The ledger sleeps unburdened, poised between promise and doom.',
        'Nothing has been etched into this cycle; the future remains an uncarved stone.',
        'A hushed beginning stretches before you—first log a deed, then ask the heavens.'
      ],
      partial: [
        'Partial threads glimmer in the glass; half the omen remains veiled from sight.',
        'Only fragments of the ledger answer; speak more trials to complete the reading.',
        'A broken constellation cannot name the whole season—more records must emerge from mist.',
        'Half-lit runes flicker across the vellum, withholding judgment until the picture forms.',
        'You offer a sliver of the chronicle and ask for the whole sky; feed the tally further.',
        'Incomplete signs drift like fog over ruined altars—too soon to read the final arc.',
        'Some measures answer while others sit mute in shadow, leaving the prophecy half-blind.',
        'A partial reckoning is a half-drawn blade; bring more entries before trusting the shape.',
        'The stars reveal only a fraction of the pattern while gaps still riddle the record.',
        'A dim, unfinished mosaic stares back—more trials are needed to see the true design.',
        'The omen hesitates where data is missing, refusing to guess what has not yet occurred.',
        'Scattered embers glow in the dark, yet too few to tell whether fire or ash will rule.'
      ],
      forfeited: [
        'CSAT has fallen below 75%—the whole coffer turns to ash and every boon is forfeit, you wretched fool.',
        'A shattered truce below 75% CSAT severs the treasure line; all gold slips into void like spilled wine.',
        'Below 75% CSAT, the ancient pact curdles and every promised bonus rots before your eyes.',
        'You let CSAT sink under 75% and watched a kingdom’s payout burn to worthless cinders.',
        'Seventy-five percent was the sacred ward, and you broke it—now not a single bonus coin remains.',
        'The treasury doors slam shut as CSAT drops below 75%; all hard-won boons are stripped away.',
        'A dismal CSAT below 75% turns golden hope into bitter slag—forfeited to the last copper.',
        'When CSAT falls beneath 75%, even righteous work elsewhere cannot save a gutted bonus.',
        'The glass darkens with shame: CSAT below 75% has cast the entire bonus into oblivion.',
        'You walked straight off the cliff below 75% CSAT, dragging every bonus tier down into the abyss.',
        'All boons lie dead on the threshold because CSAT slipped under 75%—a grim, self-inflicted ruin.',
        'The stars mock a CSAT below 75%: the whole bonus is forfeit and the coffer rings hollow.'
      ],
      penalty_aht: [
        'Average handle time drags past 32 minutes; the €50 toll claims its heavy price.',
        'Time stretches like tar past 32m—a €50 shadow is taxed from the treasury.',
        'You linger past 32 minutes per case like a senile monk, and the ledger carves €50 away.',
        'Thirty-two minutes is the hourglass limit; crossing it bleeds €50 straight from the hoard.',
        'Slow, meandering hands have stretched AHT past 32m, inviting a grim €50 cut.',
        'The clock tolls past 32 minutes with heavy malice, claiming €50 for wasted hours.',
        'Dragging every trial beyond 32 minutes turns patience into a €50 wound on the tally.',
        'AHT creeps past 32m while the coffers lose €50—even time grows weary of such delay.',
        'Past 32 minutes, the hour turns hostile and exacts a €50 tribute from your reward.',
        'Your pace has grown leaden past 32m, and the reckoning strips €50 without mercy.',
        'A sluggish hand past 32 minutes invites a €50 curse upon the final payout.',
        'The pendulum swings past 32m too often, leaving a €50 scar across the ledger.'
      ],
      penalty_rr: [
        'Repeat rate falls under 84%; old specters return and cost €25 from the hoard.',
        'Unfinished ghosts linger below 84% RR, bleeding €25 from the realm’s coffers.',
        'Below 84% RR, unresolved problems crawl back from the grave and tax €25 away.',
        'A repeat rate under 84% proves the work did not hold, costing €25 from the pot.',
        'Old troubles rise again when RR drops below 84%, stripping €25 from what you earned.',
        'Beneath 84% RR, the same curse returns to haunt the ledger for a €25 penalty.',
        'The cycle repeats itself below 84% RR, and the tally docks €25 for the lingering rot.',
        'When RR falls short of 84%, past work unravels and costs €25 in retribution.',
        'Ghosts of half-solved cases walk below 84% RR, claiming €25 from the treasury.',
        'An RR under 84% leaves unfinished threads that tug €25 loose from your bonus.',
        'The omen frowns on RR beneath 84%—unsettled business exacts a €25 price.',
        'Below 84% RR, the same wound reopens and drains €25 from the coffer.'
      ],
      combined_woes: [
        'Multiple fractures scar the ledger at once; storm clouds gather over every coin, you damned fool.',
        'Several trials falter together—the omen darkens before the tally can prosper.',
        'Penalties and missed marks pile up like corpses after a bad siege; the payout is battered.',
        'A chorus of setbacks rings through the glass—more than one flaw is gnawing your reward.',
        'Several thresholds fail at once, turning what could have been triumph into a tangled mess.',
        'You face compounding flaws across the ledger—fixing one crack won’t hide the rest.',
        'Storms strike on multiple fronts at once, stripping value before the tally can stand tall.',
        'A grim cluster of shortfalls weighs down the record; discipline is fraying in more than one place.',
        'Multiple metrics stumble together, leaving the ledger bruised and far from grace.',
        'Several faults converge at once—the stars foresee heavy drag unless you tighten every front.',
        'More than one flaw mars this chronicle, turning potential gold into a ragged compromise.',
        'The ledger groans under stacked failures—half-measures will not mend a multi-front slump.'
      ],
      approaching: [
        'A threshold hums within reach—one steady stroke can tip the balance.',
        'The mark stands close; another clean resolve may still claim the prize.',
        'You stand inches from a threshold—do not choke at the final step like a coward.',
        'The target line shimmers just ahead; steady hands can still pull it across.',
        'A crucial threshold trembles within grasp—one sharp turn of fortune could seal it.',
        'So close to the mark that the ledger almost smells the gold—finish cleanly.',
        'The boundary line is within sight; one more strong result may cross it.',
        'You hover right beside a key threshold—don’t squander proximity through carelessness.',
        'A single clean push could carry this metric past the threshold into reward.',
        'The mark is close enough to touch, yet unfinished until the line is truly crossed.',
        'A narrow margin separates you from the threshold—keep your nerve steady.',
        'The threshold stands just beyond reach; one decisive effort can bring it home.'
      ],
      reward_earned: [
        'The threshold is met and gold answers the call—bounty rests within reach.',
        'A target falls cleanly in line; the ledger grants its promised tribute.',
        'A bonus threshold yields to your hand, adding real coin to the chronicle.',
        'The mark is cleared and the coffer answers with a rightful bonus.',
        'You have met the standard on that line, and the ledger honors its word.',
        'A threshold crossed in good order brings tangible bounty to the tally.',
        'The required mark stands conquered, lifting the payout with earned weight.',
        'A clean threshold clear answers the test and strengthens the bonus pool.',
        'The target is met without excuse, and gold gathers where discipline held.',
        'You crossed the line cleanly—a welcome boon settles onto the ledger.',
        'The threshold is satisfied, turning steady work into measurable reward.',
        'A rightful bonus tier is claimed as the target falls into place.'
      ],
      reward_missed: [
        'The mark slips just out of grasp; no bonus crown is claimed there.',
        'So close to the threshold, yet the coffer keeps its extra gold locked.',
        'That bonus threshold remains uncrossed, leaving extra coin out of reach.',
        'You fell short of the target line, so no bonus is granted on that front.',
        'The mark stands above your current rate, withholding its extra tribute.',
        'A missed threshold leaves the bonus pot untouched where it could have grown.',
        'The line was not cleared—no extra gold answers that metric today.',
        'Short of the bonus threshold, the ledger offers no added crown there.',
        'That target remains unfulfilled, keeping its bonus sealed away.',
        'You missed the qualifying mark, leaving bonus value on the table.',
        'The threshold holds firm against you, denying extra reward on that score.',
        'No bonus is claimed there—the metric sits shy of its required mark.'
      ],
      excellent: [
        'Every ward holds firm and the full €300 boon gleams across the chronicle.',
        'Rare mastery rules the ledger—triumph echoes through every measured trial.',
        'Across all five measures, discipline holds strong and the full €300 prize stands in sight.',
        'An uncommon alignment of speed, quality, and satisfaction crowns this record.',
        'Every threshold is honored with rare precision—the ledger shines at full strength.',
        'Few mortals keep all wards intact like this; the full €300 boon gleams ahead.',
        'Clean execution across every metric marks a formidable run in the chronicle.',
        'The stars record rare order here—every standard met, no penalties tainting the line.',
        'A commanding ledger from top to bottom—strength holds across every measure.',
        'Every ward stands unbroken, and the full €300 reward rests squarely in view.',
        'Mastery is plain on the page—every metric aligns without a single blemish.',
        'A rare triumph across the board; the chronicle reads like a legend in the making.'
      ],
      poor: [
        'Heavy shadows weigh down the record; little bounty survives the present strain.',
        'The ledger groans under steep setbacks—sharp discipline is needed to turn the tide.',
        'Weak marks drag across the record, leaving the bonus far below its heights.',
        'The chronicle reads like a hard winter—too many numbers fall short of the mark.',
        'Steep shortfalls weigh heavily on this tally; excuses will not rescue the payout.',
        'The ledger shows rough ground across multiple metrics—much work remains.',
        'A grim stretch across the numbers leaves little room for celebration.',
        'Performance lags across key lines, dulling the shine of the bonus pool.',
        'The record is heavy with shortfalls—only sharper execution will turn it around.',
        'Weak metrics crowd the page, pulling the reward down into thin air.',
        'A sobering tally across the board—the ledger demands firmer control.',
        'The numbers run low and heavy; this chronicle needs a decisive rally.'
      ]
    },

    dwarven_war_crier: {
      id: 'dwarven_war_crier',
      name: 'Dwarven War-Crier',
      openers: [
        'By the beard of the First King!',
        'Hoots, mon! Hear the iron horn:',
        'There’s a moose loose aboot this hoose—listen sharp!',
        'Hammer and anvil ring out:',
        'Bollocks to slack work—hear this:',
        'Clang the war-bell, lads:',
        'Spit in the fire and listen up:',
        'By my grandmother’s battle-axe:'
      ],
      empty: [
        'Empty forge, lad—no cases or monits on the slab yet. Light the coals and begin.',
        'Quiet as a closed mine. Log a case or monit before I holler at thin air.',
        'Nothin’ on the anvil yet but cold iron and cobwebs. Get to work, ya daft sod!',
        'The ledger’s barer than a dwarf’s skull after a tavern brawl. Log some entries!',
        'Zero cases, zero monits—are ye on holiday or just napping behind the barrels?',
        'A blank slab doesn’t forge a single copper. Swing the hammer and log a case!',
        'Quiet as a grave in the deep roads. Put some numbers on the board!',
        'No data in the hopper yet—don’t stand there gawping like a sheep in a thunderstorm!',
        'The tally’s empty as my ale mug on a Monday. Start logging!',
        'Not a bloody mark on the slate yet. Get moving before I lose my voice!',
        'An empty forge earns fuck-all. Feed it some cases and monits!',
        'Nothing recorded yet—even a rock has more going on than this blank sheet.'
      ],
      partial: [
        'Half the tally’s missing from the board—don’t ask me to hammer cold iron blind.',
        'Some gauges are blank yet; bring the rest of the figures to the anvil.',
        'Ye’ve given me half a shield and asked if it’ll stop a troll. Log more data!',
        'Missing numbers all over the shop—hard to call the fight when half the scouts are AWOL.',
        'Half-baked figures on the board! Bring the rest of the tally before I pass verdict.',
        'Some metrics are still sitting empty like unlit torches. Fill out the record!',
        'You can’t weigh a mountain with one pebble—get more cases and monits logged.',
        'Part of the ledger’s still in the dark, ya cheeky bugger. Bring more numbers!',
        'A half-finished tally is only half the story. Keep logging!',
        'Some gauges are blank as a badger’s backside. Feed more data into the forge!',
        'Incomplete numbers make for a half-blind war-crier. Log the rest!',
        'Not enough on the board yet to see the whole fight clearly.'
      ],
      forfeited: [
        'CSAT under 75%—ye’ve blasted the whole bonus keg to splinters! Zero gold!',
        'Below 75% CSAT and the entire bloody bonus barrel’s gone! Aye, that stings.',
        'Bollocks! Under 75% CSAT and every last bonus coin goes up in smoke!',
        'Ye dropped CSAT below 75%—now the whole bonus keg’s flat as piss on a plate!',
        'Seventy-five percent was the floor and ye fell right through it—zero bonus, ya numpty!',
        'The entire bonus hoard’s wiped out because CSAT dipped under 75%! Fuckin’ brutal!',
        'A CSAT below 75% turns the whole bonus pot to slag. Not a single coin left!',
        'Ye kicked the ale barrel over below 75% CSAT—now nobody’s drinking bonus gold!',
        'Below 75% CSAT is a total catastrophe—every bonus tier’s dead in the water.',
        'Bloody hell, under 75% CSAT forfeits the whole lot! Tighten up, man!',
        'The bonus coffer’s empty as a beggar’s pocket because CSAT fell below 75%.',
        'You’ve blown the whole bonus payout below 75% CSAT—that’s a proper kick in the teeth.'
      ],
      penalty_aht: [
        'AHT over 32 minutes—ye’re carving runes with a butter knife and losing €50!',
        'Past 32m AHT! Even a sleepy badger wraps up quicker than a €50 dock.',
        'Over 32 minutes AHT?! Are ye chiseling each case by hand?! Minus €50!',
        'Dragging AHT past 32m is costing ye €50—move yer arse and wrap ’em up!',
        'Thirty-two minutes is plenty of time—going over it docks €50 straight off the top!',
        'Slow as cold treacle past 32m AHT, and it’s costing €50 a pop.',
        'Ye’re taking all bloody day past 32 minutes—there goes €50 to the void!',
        'AHT above 32m triggers a €50 penalty—stop admiring the scenery and close the case!',
        'Past 32 minutes AHT and the ledger’s taking a €50 bite out of yer hide.',
        'Too damn slow past 32m! That’s €50 shaved right off the bonus.',
        'AHT over 32 minutes is a slow-motion trainwreck costing €50.',
        'Get a move on! Past 32m AHT means a €50 hit to the pouch.'
      ],
      penalty_rr: [
        'RR under 84%—the same bloody beasts keep crawling back for a €25 tax!',
        'Below 84% RR means fighting the same troll twice and surrendering €25.',
        'Under 84% RR?! Fix the damn thing properly the first time or lose €25!',
        'Repeat rate below 84% is bleeding €25—stop letting old messes come back!',
        'Below 84% RR and the same pests keep knocking—minus €25 for the trouble!',
        'An RR under 84% means half-finished work coming back to bite ye for €25.',
        'Ye’re losing €25 because RR fell under 84%—hammer the root cause, not the symptoms!',
        'Below 84% RR is a €25 nuisance tax on unresolved work.',
        'The same bloody issues keep returning under 84% RR—there goes €25!',
        'RR below 84% costs €25—do it right so ye don’t do it twice!',
        'A repeat rate under 84% docks €25—keep ’em down once they’re down!',
        'Under 84% RR means sloppy follow-through and a €25 hit.'
      ],
      combined_woes: [
        'Two or three alarms ringing at once—tighten yer belt before the whole hall groans!',
        'Multiple metrics taking a beating; steady the line and stop the bleeding.',
        'Bloody hell, several things are going sideways at once—stop the rot on every front!',
        'Multiple hits on the board at once! Don’t stand there scratching yer head—sort it out!',
        'Several metrics are taking a kicking together; pull yerself together!',
        'More than one flaw’s dragging the tally down—fix the leaks before the ship sinks!',
        'A whole pile of troubles landing at once—keep yer head and tackle the worst first.',
        'Multiple shortfalls hit at once—the ledger’s taking a proper hammering.',
        'Several numbers are looking rough together—time for serious grit, not excuses.',
        'Two or more fronts are hurting at once—don’t let the whole line crumble!',
        'Stacked problems on the board right now—get fierce and clean ’em up.',
        'Multiple metrics are lagging together—steady up and fight back!'
      ],
      approaching: [
        'Right on the doorstep of the mark—give it one last heave and claim it!',
        'Close enough to smell the ale—keep your nerve and cross the line.',
        'Ye’re right next to the threshold—don’t bottle it now, push it over!',
        'Just a hair’s breadth from the mark—one clean stroke and it’s yours!',
        'So close ye can taste the gold—don’t slack off at the finish line!',
        'The target’s right in front of ye—give it one more stout heave!',
        'Nearly at the threshold—keep the pressure on and claim the ground!',
        'Right on the edge of the mark—don’t let it slip away now!',
        'One good push could put ye right over that threshold—get after it!',
        'Close as makes no difference—finish strong and lock it in!',
        'The mark’s within arm’s reach—don’t lose focus now!',
        'Just shy of the threshold—one sharp effort can tip the scales!'
      ],
      reward_earned: [
        'Aye, that target’s battered flat—good coin earned for honest work!',
        'Threshold cleared! That’s proper gold clinking into the pouch.',
        'Boom! Target cleared and bonus coin earned—that’s how it’s done!',
        'That threshold’s been smashed clean—good gold added to the tally!',
        'Proper job! You cleared the mark and earned a real bonus bump.',
        'The threshold’s met—hear that coin clink into the coffer!',
        'Clean work cleared that target—extra gold’s in the bag.',
        'You hit the mark square on—bonus coin well earned!',
        'That’s a solid threshold clear—good reward for solid work.',
        'Target met! The ledger pays out when ye hit the mark clean.',
        'Nice hit on that threshold—extra gold coming through!',
        'You cleared the line proper—bonus coin earned!'
      ],
      reward_missed: [
        'Missed the mark by a hair—no extra gold for near-misses in the mountain.',
        'Short of the tier line; the bonus stays bolted behind iron.',
        'Came up short of that threshold—no extra coin paid out there.',
        'Missed the bonus mark—close doesn’t fill the ale keg, lad.',
        'Below the threshold line, so that bonus stays locked away.',
        'Didn’t quite clear that mark—no extra gold earned on that one.',
        'Short of the target—the bonus stays right where it is.',
        'Missed that tier by enough to get zero extra coin for it.',
        'Not quite over the line—no bonus payout on that metric.',
        'Fell short of the mark—keep swinging and try again.',
        'That threshold held firm—no extra gold claimed there.',
        'Missed the target line—no bonus reward on that front.'
      ],
      excellent: [
        'By the First King, the whole hall’s singing—strong numbers across the board!',
        'Clean work, stout pace, and solid marks—raise a mug to a proper run!',
        'Bloody marvellous! Every metric’s standing tall and the full €300’s in sight!',
        'Top-notch work across the board—not a weak link in the chain!',
        'That’s a war-winning run right there—strong numbers all around!',
        'Every single metric’s firing right—raise a horn to that tally!',
        'Clean, fast, and sharp across the board—proper dwarf-grade work!',
        'All five metrics looking stout—the full €300 bonus is right there for the taking!',
        'Not a dud in the lot—every measure’s holding strong!',
        'A cracking run across every metric—the hall’s roaring!',
        'Sharp numbers from top to bottom—keep that momentum rolling!',
        'Every target’s in great shape—that’s how ye run a chronicle!'
      ],
      poor: [
        'Rougher than a gravel stew—several numbers are taking a proper thrashing.',
        'The ledger’s looking battered; time to rally and clean up the mess.',
        'Rough going across the board—the numbers are taking a beating.',
        'Plenty of work needed here—several metrics are lagging bad.',
        'The scorecard’s looking bruised—time to buckle down and turn it around.',
        'Weak numbers across the board right now—don’t sulk, fix it!',
        'A tough stretch on the tally—several metrics are well off the pace.',
        'The ledger’s taking heavy hits—time for a proper comeback.',
        'Several numbers are dragging low—sharpen up and get back on track.',
        'Not a pretty sight on the board—plenty of ground to make up.',
        'The metrics are taking a beating—rally the troops and push back!',
        'Low marks across key lines—time to roll up the sleeves.'
      ]
    },

    royal_inquisitor: {
      id: 'royal_inquisitor',
      name: 'Royal Inquisitor',
      openers: [
        'The Court of Inquiry observes:',
        'Your file is reviewed under strict protocol:',
        'A formal notation from the High Chancery:',
        'The magistrate’s quill pauses here:',
        'By royal warrant, your dossier is examined:',
        'The Inquisitor raises a single eyebrow at this:',
        'Her Majesty’s auditors have taken note:',
        'A sharp ruling from the Chancery:'
      ],
      empty: [
        'An unwritten docket presents no evidence—either for commendation or censure.',
        'No entries appear on the record; judgment is reserved until cases are logged.',
        'A blank dossier is remarkably easy to defend and remarkably useless to the Crown.',
        'Nothing has been submitted to the docket yet—even silence must eventually be accounted for.',
        'No cases or audits appear on file; the bench awaits actual evidence.',
        'An empty ledger offers neither merit nor excuse—begin your record properly.',
        'The Chancery finds an unpopulated sheet—submit your work before seeking appraisal.',
        'No entries grace this docket yet; one hopes substance will follow form.',
        'A pristine blank page proves nothing save inactivity.',
        'The magistrate finds zero entries on record—log your cases and audits.',
        'Nothing is yet inscribed upon this chronicle; judgment is deferred.',
        'An untouched docket leaves the Crown’s ledger entirely unmoved.'
      ],
      partial: [
        'The dossier remains incomplete; partial records yield only a provisional note.',
        'Several metrics lack sufficient entries for a full inquisitorial finding.',
        'Presenting half a file to the bench is scarcely an exercise in thoroughness.',
        'Incomplete figures invite provisional scrutiny rather than final praise.',
        'Several measures remain unsubstantiated on the docket; complete the record.',
        'A partial dossier leaves too many questions unanswered for the Crown.',
        'Half-formed numbers produce only a tentative assessment from the Chancery.',
        'Missing metrics leave this file unfinished—bring the full record forward.',
        'One cannot pass complete judgment on half-assembled evidence.',
        'Gaps in the record keep this assessment provisional at best.',
        'The docket lacks full coverage across metrics—log further entries.',
        'A fragmented file yields only a measured, incomplete note.'
      ],
      forfeited: [
        'CSAT below 75% constitutes a total breach of standards; all bonus awards are revoked, you bungler.',
        'Falling under 75% CSAT forfeits the entire bonus—a most costly and embarrassing lapse.',
        'A CSAT beneath 75% is an absolute disgrace; every bonus award is summarily forfeited.',
        'With CSAT below 75%, all bonus entitlement is extinguished—an appalling display.',
        'You have dragged CSAT beneath 75% and forfeited the entire bonus—hardly dignified.',
        'Below 75% CSAT, the Crown revokes every bonus coin without hesitation.',
        'A dismal CSAT under 75% forfeits all bonus payout—a stain upon the file.',
        'Falling below 75% CSAT wipes out the entire bonus—a most unseemly collapse.',
        'The bench records total bonus forfeiture due to CSAT falling beneath 75%.',
        'A CSAT under 75% forfeits every bonus tier—sloppy work meets a severe end.',
        'All bonus awards are forfeited under 75% CSAT—the docket reflects severe negligence.',
        'With CSAT beneath 75%, no bonus survives—a thoroughly regretful outcome.'
      ],
      penalty_aht: [
        'Average handle time exceeds 32 minutes; a €50 deduction is duly entered.',
        'Lingering past 32m AHT incurs a €50 penalty—brevity is a civic virtue you sorely lack.',
        'Exceeding 32 minutes AHT triggers a €50 deduction—dawdling is hardly regal.',
        'AHT above 32m draws a €50 penalty onto the file; efficiency seems optional here.',
        'Taking past 32 minutes per case costs €50—the court is unimpressed by such delay.',
        'AHT over 32m results in a €50 deduction—procrastination is an expensive habit.',
        'Lingering beyond 32 minutes costs €50 from the tally—time is not yours to waste.',
        'An AHT above 32m incurs a €50 penalty—sharpen your pace immediately.',
        'Past 32 minutes AHT, a €50 deduction is entered into the record.',
        'Exceeding 32m AHT costs €50—a most tedious excess.',
        'AHT over 32 minutes brings a €50 penalty—swiftness is clearly lacking.',
        'The ledger notes a €50 deduction for AHT exceeding 32 minutes.'
      ],
      penalty_rr: [
        'Repeat rate beneath 84% betrays unresolved work, exacting a €25 deduction.',
        'Below 84% RR points to recurring defects and a €25 reduction in payout.',
        'An RR under 84% suggests matters were not settled properly the first time—minus €25.',
        'Falling below 84% RR incurs a €25 deduction—recurring errors are most tiresome.',
        'Below 84% RR, unfinished work returns to cost €25 from the award.',
        'A repeat rate beneath 84% draws a €25 penalty—thoroughness is plainly wanting.',
        'Under 84% RR, old defects resurface and exact a €25 deduction.',
        'An RR below 84% costs €25—the docket notes recurring lapses.',
        'Falling under 84% RR triggers a €25 penalty against the bonus.',
        'Below 84% RR betrays repeat friction—minus €25 is entered.',
        'A repeat rate under 84% costs €25—hardly a mark of precision.',
        'The record imposes a €25 deduction for RR falling beneath 84%.'
      ],
      combined_woes: [
        'Compound deficiencies appear across the ledger; excuses will not balance the books, you wretch.',
        'Multiple thresholds stand breached simultaneously—the record demands immediate correction.',
        'Several metrics fail standards at once—a rather messy showing for the Chancery.',
        'Multiple deficiencies mar this file simultaneously—excuses will scarcely suffice.',
        'Several targets are missed or penalized at once—the docket looks decidedly frayed.',
        'Compound shortfalls appear across the record—order must be restored on multiple fronts.',
        'Several standards falter together—the court notes a troubling lack of discipline.',
        'Multiple issues weigh on this ledger at once—hardly an exemplary return.',
        'Several metrics breach expectations simultaneously—correction is overdue.',
        'A cluster of shortfalls appears on file—the ledger calls for firmer rigor.',
        'Multiple flaws undermine this record at once—most unsatisfactory.',
        'Several thresholds fail together—the bench sees ample room for improvement.'
      ],
      approaching: [
        'You stand near the threshold, yet proximity is not compliance—finish cleanly.',
        'Within striking distance of the standard; precision now determines the outcome.',
        'Approaching a threshold is not the same as clearing it—complete the work properly.',
        'You sit just shy of a target mark—do not let sloppiness spoil proximity.',
        'Near the threshold line, yet still short of the standard—steady yourself.',
        'Within reach of a target, though not yet there—precision is required.',
        'A metric nears its threshold—finish cleanly rather than stopping short.',
        'Close to the standard, yet still unverified by crossing the line.',
        'Approaching a key mark—maintain discipline until it is fully met.',
        'Just short of a threshold—proximity earns no credit on its own.',
        'Near the target line—bring the metric cleanly across.',
        'Within striking range of a threshold—do not falter now.'
      ],
      reward_earned: [
        'The required standard is satisfied and the corresponding award is duly credited.',
        'Compliance meets the threshold; a rightful bonus tier is secured.',
        'A threshold is met in proper order, and the corresponding bonus is granted.',
        'The standard is satisfied on that metric, earning its due award.',
        'A clean threshold clear secures a rightful bonus tier on the record.',
        'The target is met, and the ledger credits the earned reward.',
        'Compliance on that front meets the mark and adds to the bonus.',
        'A bonus threshold is satisfied—credit where credit is due.',
        'The required standard is met, lifting the bonus tally accordingly.',
        'That threshold is cleared cleanly, earning its corresponding award.',
        'The metric meets its standard and secures its bonus tier.',
        'A proper threshold clear brings its rightful award to the ledger.'
      ],
      reward_missed: [
        'The bonus threshold was not achieved; the ledger records no reward for this line.',
        'Short of the qualifying mark—the higher tier remains ungranted.',
        'That bonus threshold was missed, leaving no reward on that score.',
        'The qualifying standard was not reached—no bonus is awarded there.',
        'Short of the target mark, the ledger withholds that bonus tier.',
        'That bonus threshold remains unmet—no extra award is recorded.',
        'The mark was not achieved, so no bonus applies to that line.',
        'Falling short of the threshold leaves that bonus ungranted.',
        'The required bonus mark was missed—no reward is added there.',
        'Short of the qualifying threshold—the extra award remains out of reach.',
        'That bonus target went unmet on the current record.',
        'No bonus is granted there as the threshold was not cleared.'
      ],
      excellent: [
        'Exemplary standing across the board—the ledger reflects rare order and precision.',
        'High standards upheld throughout; the court notes a commendably strong record.',
        'An exemplary showing across all metrics—the full €300 award stands cleanly in view.',
        'Every standard is met with admirable composure—a model record for the docket.',
        'Order, speed, and quality align across the board—a most creditable performance.',
        'All five metrics stand in strong order—rarely does a file look so tidy.',
        'High standards are upheld across every measure—the Chancery is pleased.',
        'A commanding record across the board—every metric meets expectations.',
        'Clean execution across every line gives this dossier notable merit.',
        'All five metrics hold strong—an impressive display of discipline.',
        'The ledger shows thorough command across every measured standard.',
        'An enviable standing across the board—every threshold is honored.'
      ],
      poor: [
        'Substandard performance mars the docket; corrective action is plainly overdue.',
        'Repeated shortfalls weaken the standing of this chronicle.',
        'Substandard marks weigh heavily across the board—a most uninspiring docket.',
        'Key metrics fall well below standard—the file requires serious remediation.',
        'A weak showing across multiple metrics—hardly befitting high standards.',
        'The record reflects lagging performance across several fronts.',
        'Shortfalls across the board weaken this chronicle’s standing.',
        'The docket shows considerable ground to recover across key measures.',
        'Poor results across multiple metrics mar an otherwise hopeful slate.',
        'The current figures fall short across several lines—rigor is needed.',
        'A subdued and lagging record across key metrics.',
        'The docket calls for firmer execution after weak numbers across the board.'
      ]
    },

    battle_commander: {
      id: 'battle_commander',
      name: 'Battle Commander',
      openers: [
        'Frontline report from the war room:',
        'Hold formation and hear the dispatch:',
        'Vanguard assessment on the current campaign:',
        'Eyes on the objective—here is the sitrep:',
        'Listen up, squad—here’s the field report:',
        'Command post to all lines:',
        'No excuses on the wire—here’s the status:',
        'Tactical read on the current push:'
      ],
      empty: [
        'The sector is quiet and no troops have engaged yet; deploy your first entries.',
        'No battle log recorded yet. Stand ready and log your first engagement.',
        'Zero troops on the ground yet—you can’t win a campaign from an empty map.',
        'No engagements logged yet. Move out and put your first entries on the board.',
        'The sector’s untouched and silent. Deploy your first case or audit and get moving.',
        'No intel on the board yet—log your opening moves before calling the line.',
        'An empty war-room map tells us nothing. Start logging engagements.',
        'Zero entries recorded yet—take position and begin the log.',
        'Nothing reported from the front yet. Get your first entries in.',
        'The board is cold and blank—put live data on the field.',
        'No action logged yet—step up and record your first case.',
        'Quiet sector with no entries yet—begin the campaign log.'
      ],
      partial: [
        'Scouts report incomplete intelligence; several sectors have yet to report in.',
        'Partial telemetry on the map—push more data through before calling victory.',
        'Half the sectors are still dark—get more data reporting before reading the whole front.',
        'Incomplete intelligence on the board—push more entries through for a full picture.',
        'Some lines haven’t reported in yet—keep feeding data into the tracker.',
        'Partial telemetry leaves blind spots on the map—log more records.',
        'Not enough data on the board yet to judge the entire campaign.',
        'Several metrics lack full intel—bring more entries forward.',
        'Partial reporting on the front—keep pushing cases and audits through.',
        'The map’s only half-filled—get more data in before drawing conclusions.',
        'Missing metrics leave gaps in the sitrep—log further entries.',
        'Incomplete numbers on the board—keep the pipeline moving.'
      ],
      forfeited: [
        'CSAT under 75%—we lost the flank and forfeited the entire bonus payout, dammit.',
        'A drop below 75% CSAT wipes out the bonus reserve; lock down client outcomes.',
        'CSAT fell below 75% and blew the whole bonus reserve—that’s a brutal flank collapse.',
        'Under 75% CSAT forfeits the entire bonus—we just bled out the whole reward pool.',
        'A collapse below 75% CSAT wiped out every bonus coin—lock down the line!',
        'CSAT under 75% means zero bonus payout—we gave up the whole prize on that breach.',
        'The bonus reserve’s gone because CSAT dropped below 75%—hold the line tighter!',
        'Falling under 75% CSAT forfeits all bonus—that’s a heavy hit to morale and payout.',
        'Under 75% CSAT wipes out the bonus—fix client outcomes before anything else.',
        'We lost the bonus pool below 75% CSAT—regroup and lock down standards.',
        'A CSAT under 75% forfeits the entire bonus—no excuses, lock it down.',
        'Below 75% CSAT took the whole bonus off the table—sharpen up!'
      ],
      penalty_aht: [
        'AHT over 32 minutes bogs down the advance and costs €50 in momentum.',
        'Dragging past 32m AHT stalls the push—cut the delay and save the €50.',
        'AHT above 32m is bogging down the column and costing €50—pick up the pace!',
        'Over 32 minutes AHT slows the whole advance and docks €50—move faster!',
        'Dragging past 32m AHT is burning €50—tighten execution and cut the lag.',
        'AHT over 32m stalls momentum and costs €50—don’t let cases drag out.',
        'Past 32 minutes AHT, we’re losing €50 to slow execution—speed it up!',
        'An AHT above 32m is a €50 drag on the campaign—keep things moving.',
        'Over 32m AHT costs €50—cut the delay and stay sharp.',
        'Slow AHT past 32 minutes is costing €50—push the tempo!',
        'AHT above 32m docks €50—streamline the work and keep pace.',
        'Past 32m AHT bleeds €50—tighten turnaround time.'
      ],
      penalty_rr: [
        'RR below 84% means enemies keep rallying—another €25 lost to unfinished work.',
        'Below 84% RR lets resolved issues return; finish them clean or pay €25.',
        'Under 84% RR, old problems keep rallying and costing €25—finish ’em for good!',
        'A repeat rate below 84% bleeds €25—don’t leave targets half-cleared.',
        'Below 84% RR lets unresolved work bounce back for a €25 hit.',
        'RR under 84% costs €25—clear objectives cleanly so they don’t return.',
        'Below 84% RR means fighting the same battle twice and losing €25.',
        'An RR under 84% costs €25—lock down resolutions properly.',
        'Under 84% RR drains €25 from the push—clean up repeat issues.',
        'Repeat rate below 84% docks €25—finish the job the first time.',
        'Below 84% RR costs €25—don’t let old issues regroup.',
        'RR under 84% takes a €25 toll—tighten resolution quality.'
      ],
      combined_woes: [
        'Multiple fronts are under pressure at once—regroup and hit the weakest line first.',
        'Several metrics are flashing red; tighten execution across every sector.',
        'Multiple lines are taking heat right now—regroup, prioritize, and push back!',
        'Several fronts are slipping simultaneously—stop the bleed across the board.',
        'We’ve got stacked shortfalls across multiple metrics—tighten discipline everywhere.',
        'Multiple fronts are under strain at once—no time to coast.',
        'Several metrics are lagging together—regroup and hit the hardest problem first.',
        'Stacked issues across the board right now—get sharp and take control.',
        'Multiple fronts are hurting at once—execute cleanly and steady the line.',
        'Several targets are missing together—push harder across the board.',
        'Multiple pressures hitting at once—keep formation and grind it out.',
        'Several lines are strained simultaneously—refocus and execute.'
      ],
      approaching: [
        'Closing in on the objective—keep pushing and don’t stall short of the line.',
        'Right near the target mark; finish strong and take the ground.',
        'We’re right on the objective’s doorstep—one clean push takes it!',
        'Closing in on the mark—don’t ease up before crossing the line.',
        'Right near the threshold—push through and secure the ground.',
        'Within striking distance of the objective—finish hard!',
        'Nearing the mark—keep pressure on and take the line.',
        'Right beside the threshold—one solid effort puts us over.',
        'Closing fast on the target—stay sharp and finish strong.',
        'Near the mark—don’t stall out at the final stretch.',
        'Within reach of the threshold—push it over the line!',
        'Right near the objective—hold discipline and close it out.'
      ],
      reward_earned: [
        'Objective secured! That metric cleared the line and earned its bonus ground.',
        'Strong execution on that front—the bonus reward is won.',
        'Target taken clean—bonus ground secured on that metric!',
        'That objective is locked down, adding solid bonus to the campaign.',
        'Clean push cleared the threshold and earned its reward.',
        'Objective captured—that’s bonus ground won by solid execution.',
        'Threshold cleared on that front—good reward earned.',
        'That target’s secured—strong work across the line.',
        'Objective met—bonus value added to the tally.',
        'Clean clear on that metric—reward earned.',
        'Target secured on that front—keep the momentum going.',
        'Threshold taken—solid execution pays off.'
      ],
      reward_missed: [
        'Fell short of the bonus line—no extra reward taken on that sector.',
        'Close fight, but the threshold held; regroup for the next push.',
        'Came up short of that bonus mark—no extra ground taken there.',
        'Missed the bonus threshold—regroup and hit it harder next.',
        'Short of the mark on that front—no extra reward claimed.',
        'The threshold held against us—no bonus taken on that line.',
        'Missed that target mark—keep pushing and close the gap.',
        'Short of the bonus line—no extra payout there.',
        'Didn’t clear that threshold—regroup and press on.',
        'Fell short of the target—no bonus earned on that metric.',
        'Missed the mark—tighten execution for the next push.',
        'Short of the threshold—no extra ground gained there.'
      ],
      excellent: [
        'Disciplined execution across the line—strong standing and full command.',
        'The campaign is running sharp—high marks across the board.',
        'Locked-in execution across every front—full €300 bonus ground is wide open!',
        'Every metric is holding strong—sharp discipline across the whole command.',
        'Clean campaign run across all five metrics—strong work from top to bottom.',
        'Every objective’s in solid shape—the line is running sharp.',
        'High marks across the board—disciplined execution all around.',
        'Every metric is performing well—full command on the field.',
        'Strong, steady execution across all fronts—keep the pressure on.',
        'Every target’s in great shape—clean campaign work.',
        'All five metrics holding strong—sharp discipline across the board.',
        'Solid execution across every line—strong campaign standing.'
      ],
      poor: [
        'Heavy casualties on the scorecard—too many metrics are bleeding ground.',
        'The line is strained; sharpen your pace and close out cases cleanly.',
        'Rough numbers across the board—we’re giving up ground on too many fronts.',
        'The scorecard’s taking heavy hits—regroup and sharpen execution.',
        'Weak metrics across key lines—time to tighten discipline and push back.',
        'Heavy drag on the board right now—sharpen up across the sector.',
        'Too many metrics lagging—regroup and rebuild momentum.',
        'The line’s under heavy strain—focus on execution and close strong.',
        'Rough scorecard across key lines—time to turn the campaign around.',
        'Weak numbers on multiple fronts—get disciplined and push.',
        'The board shows steep shortfalls—regroup and attack the weak spots.',
        'Strained numbers across key metrics—sharpen up immediately.'
      ]
    },

    cosmic_entity: {
      id: 'cosmic_entity',
      name: 'Cosmic Entity',
      openers: [
        'A fleeting pulse from beyond the nebula:',
        'Between one star’s birth and another’s drift:',
        'An ancient tide ripples through the glass:',
        'From vast, indifferent light:',
        'Across light-years of quiet dark, a signal forms:',
        'Where galaxies collide in slow silence:',
        'A cold frequency hums at the edge of the void:',
        'From deep within the event horizon:'
      ],
      empty: [
        'Nothing yet stirs in this tiny ledger; galaxies turn without a single logged case.',
        'A blank expanse of numbers—neither spark nor shadow has formed yet.',
        'An unlit void sits where entries should be—stars drift on without noticing.',
        'Zero points of light exist in this ledger yet; only dark, silent space.',
        'Before the first spark is struck, this ledger is indistinguishable from empty vacuum.',
        'No ripples disturb this quiet field yet—only unbroken cosmic stillness.',
        'A vast, empty expanse awaits its first tiny point of data.',
        'Nothing is yet recorded in this small corner of time—only silent drift.',
        'The ledger is as bare as interstellar space between galaxies.',
        'No signal yet emerges from this void—log a trial to break the silence.',
        'A quiet, unformed expanse holds neither triumph nor decay as yet.',
        'Zero entries stir the void—even time seems slow here.'
      ],
      partial: [
        'Only scattered glints appear in the dark; much of the picture remains unformed.',
        'Incomplete signals drift across the void—more data is needed to read the pattern.',
        'A few faint stars flicker while others remain hidden behind cosmic dust.',
        'Only part of the constellation is visible—the rest still sleeps in shadow.',
        'Faint, incomplete signals reach across the dark; more inputs are needed.',
        'A half-formed pattern drifts through the void, withholding its full shape.',
        'Scattered glints of data appear, leaving wide expanses still unmeasured.',
        'The signal is incomplete—too few points exist to trace the full arc.',
        'Faint echoes cross the void while missing metrics leave dark gaps.',
        'Only fragments of the pattern have emerged from the quiet dark.',
        'A partial alignment glimmers faintly—more signals are required.',
        'The picture remains half-veiled in cosmic haze.'
      ],
      forfeited: [
        'CSAT below 75% dissolves the entire bonus—a brief flare extinguished in seconds.',
        'Under 75% CSAT, the whole bonus vanishes like smoke in stellar wind.',
        'Below 75% CSAT, the entire bonus collapses inward like a dying star.',
        'A drop under 75% CSAT extinguishes every bonus spark into cold void.',
        'The whole bonus dissolves beneath 75% CSAT—gone before it could even endure.',
        'Under 75% CSAT, all bonus light is swallowed by shadow without a sound.',
        'A CSAT below 75% erases the entire bonus—a fleeting spark lost to darkness.',
        'Below 75% CSAT, the bonus horizon vanishes completely.',
        'The entire bonus unravels beneath 75% CSAT like mist in solar wind.',
        'Under 75% CSAT, no bonus survives—only quiet dissipation.',
        'A CSAT below 75% leaves the bonus field empty and dark.',
        'Beneath 75% CSAT, the whole bonus fades into nothingness.'
      ],
      penalty_aht: [
        'Past 32m AHT, a minute feels like an epoch—and €50 drifts away.',
        'Handle time stretches past 32m, shedding €50 into the quiet dark.',
        'Beyond 32 minutes AHT, time dilates heavily and €50 slips into the void.',
        'AHT stretching past 32m pulls €50 away as minutes drag like gravity wells.',
        'Past 32m AHT, slow motion exacts a quiet €50 toll from the tally.',
        'Time stretches thin beyond 32 minutes, leaving €50 behind in the dark.',
        'An AHT over 32m bends the pace slow and sheds €50 from the ledger.',
        'Past 32 minutes AHT, heavy duration costs €50 without a ripple.',
        'AHT beyond 32m drifts long and costs €50 in the tally.',
        'Slowing past 32m AHT lets €50 slip quietly away.',
        'Beyond 32 minutes AHT, duration weighs heavy and costs €50.',
        'AHT over 32m stretches out and sheds €50.'
      ],
      penalty_rr: [
        'Below 84% RR, echoes repeat endlessly, costing €25 from the tally.',
        'Recurring cases below 84% RR wear down the ledger by €25.',
        'Under 84% RR, the same signal echoes back and costs €25.',
        'A repeat rate below 84% creates recursive drag, costing €25.',
        'Below 84% RR, unresolved echoes return and shave €25 off the tally.',
        'Repeating below 84% RR wears a €25 groove into the ledger.',
        'Under 84% RR, past ripples return and cost €25.',
        'An RR beneath 84% lets old patterns loop at a €25 cost.',
        'Below 84% RR, echoes linger and subtract €25.',
        'Under 84% RR, the cycle repeats and costs €25.',
        'A repeat rate below 84% leaves a €25 mark on the tally.',
        'Beneath 84% RR, recurring drift costs €25.'
      ],
      combined_woes: [
        'Several threads fray at once, dimming the tally across multiple fronts.',
        'Multiple faults align in the same cycle; the pattern leans heavy.',
        'Several disruptions converge at once, dimming the ledger’s light.',
        'Multiple shifts pull the tally downward simultaneously.',
        'Several threads strain together, casting a heavy shadow over the cycle.',
        'Multiple faults appear together in this narrow window of time.',
        'Several metrics drift off course at once, weighing down the ledger.',
        'Multiple disruptions overlap, dimming the overall pattern.',
        'Several faults align simultaneously, pulling the tally low.',
        'Multiple threads fray together across this cycle.',
        'Several shifts weigh heavily on the ledger at once.',
        'Multiple disruptions dim the signal across key lines.'
      ],
      approaching: [
        'A threshold shimmers just ahead—barely a breath away from crossing.',
        'Near the boundary line; one more step completes the shift.',
        'A boundary hums just ahead, nearly crossed within this cycle.',
        'Barely shy of the threshold—one small shift completes the transition.',
        'The boundary line shimmers close—almost crossed.',
        'Just short of a threshold—the shift is nearly complete.',
        'A boundary sits right ahead, waiting to be crossed.',
        'Nearly across the threshold—one more step shifts the state.',
        'The boundary line is close—almost breached.',
        'Just shy of the boundary—the transition is near.',
        'A threshold shimmers within reach—barely untouched.',
        'Near the shift line—almost across.'
      ],
      reward_earned: [
        'A threshold is crossed and a bonus spark ignites within the ledger.',
        'The condition aligns; a reward tier settles onto the tally.',
        'The boundary is crossed and a bright bonus spark appears.',
        'Conditions align cleanly, adding a bonus tier to the record.',
        'A threshold is met and a warm spark settles into the ledger.',
        'The required condition holds, lighting a bonus tier.',
        'A boundary crossed brings a clear bonus spark to the tally.',
        'Conditions align and a reward tier takes form.',
        'The threshold yields, adding a bonus spark to the cycle.',
        'Alignment holds—a bonus tier settles cleanly.',
        'A threshold crossed brings a bright mark to the ledger.',
        'The condition is met and a bonus tier appears.'
      ],
      reward_missed: [
        'The boundary passes untouched—no bonus spark is granted there.',
        'Just shy of the mark; the extra payout stays out of reach.',
        'The threshold remains uncrossed—no bonus spark ignites there.',
        'Conditions fall just short—no extra tier is granted.',
        'The boundary holds—no bonus spark forms on that line.',
        'Just short of the threshold—no extra reward appears there.',
        'The line remains uncrossed—no bonus tier is added.',
        'Short of the condition—no bonus spark is granted.',
        'The boundary is not crossed—no extra payout there.',
        'Just shy of the threshold—no bonus tier forms.',
        'The mark remains untouched—no extra reward there.',
        'Short of the boundary—no bonus spark appears.'
      ],
      excellent: [
        'Rare alignment across the metrics—a bright span in a vast, quiet cosmos.',
        'All measured threads hold steady; the ledger shines at full strength.',
        'An unusual alignment holds across all five metrics—bright and unbroken.',
        'Every measured thread stays in harmony across this cycle.',
        'All five metrics shine steady—a rare, clean alignment.',
        'Rare equilibrium holds across the board—every thread intact.',
        'Every metric stands bright and steady across this span.',
        'An uncommon alignment holds cleanly across all measures.',
        'All five threads remain steady—bright and undisturbed.',
        'Every metric holds in clean alignment across the cycle.',
        'A bright, steady alignment spans all five measures.',
        'Every thread holds firm—rare clarity across the ledger.'
      ],
      poor: [
        'Dim numbers and heavy drag mark this cycle—far from stellar form.',
        'The record runs low across key metrics; much ground lies unrecovered.',
        'Faint numbers and heavy drag mark this cycle across key lines.',
        'The ledger runs dim across multiple metrics—far from bright alignment.',
        'Heavy drag weighs across key measures in this cycle.',
        'Low readings across several metrics leave the tally dim.',
        'The record shows wide drag across key lines—far from strong form.',
        'Dim numbers span multiple metrics in this cycle.',
        'Heavy drag pulls key measures low across the board.',
        'The ledger runs faint across several lines—much ground unrecovered.',
        'Low readings weigh across key metrics in this cycle.',
        'Faint alignment across key lines leaves the tally dim.'
      ]
    },

    goblin_accountant: {
      id: 'goblin_accountant',
      name: 'Goblin Accountant',
      openers: [
        'Oi! Count the coins carefully:',
        'The tally-stick clicks and clacks:',
        'I’ve checked every copper and gold piece:',
        'Listen close—the pouch tells all:',
        'Put your grubby paws on the abacus—look here:',
        'Gold, silver, or pure misery—here’s the math:',
        'The ledgers shriek and the coins rattle:',
        'Check the bottom line, ya greedy bastard:'
      ],
      empty: [
        'No cases or monits yet—pouch is untouched and the ledger’s clean as bone.',
        'Empty book, zero coins moved. Log some work so I have numbers to count.',
        'Zero entries means zero math, zero gold, zero drama. Put some numbers in!',
        'My abacus is gathering dust—log a case or monit so I can count something!',
        'No cases, no monits, no coins moving—boring! Log some work!',
        'The pouch hasn’t twitched yet because nothing’s logged. Feed the book!',
        'Empty ledger, empty math—start logging before I fall asleep on the coins.',
        'Not a single entry to tally yet—get to work so there’s real math to do!',
        'Zero entries on the books—even a goblin can’t squeeze gold from nothing.',
        'The ledger’s spotless and completely profitless so far. Log some entries!',
        'No data yet—give me numbers to crunch or quit blocking the ledger!',
        'Blank books pay zero gold—start logging cases and monits!'
      ],
      partial: [
        'Half-baked figures! Some metrics have no data yet, so don’t expect full math.',
        'Missing entries leave gaps in the calculation—feed the ledger proper numbers.',
        'Half the numbers are missing—don’t ask me to balance a half-empty book!',
        'Gaps all over the ledger—log more entries so the math actually means something.',
        'Some metrics are still blank—hard to count chickens before they’re even hatched!',
        'Missing data leaves holes in the tally—feed more entries into the book.',
        'Incomplete numbers make for half-finished math—log more cases and monits!',
        'Several metrics have zero data yet—don’t celebrate or panic too early.',
        'Half-missing figures on the board—bring more numbers to the counter!',
        'Some gauges are blank—fill out the record so I can run proper numbers.',
        'Missing entries leave gaps in the calculation—keep logging!',
        'Not enough data yet for the full financial picture.'
      ],
      forfeited: [
        'CSAT under 75%?! Poof—every last bonus coin gone! Don’t cry to me!',
        'Below 75% CSAT wipes out the whole bonus! That’s brutal arithmetic.',
        'Haha! Under 75% CSAT and the entire bonus pot just vanished into thin air!',
        'You let CSAT drop under 75% and kissed the whole bonus goodbye—ouch!',
        'Seventy-five percent was the lock on the vault, and you busted it—zero bonus gold!',
        'Every single bonus coin just evaporated because CSAT fell below 75%! Brutal!',
        'Below 75% CSAT forfeits the whole bonus—not even a copper left in the pot!',
        'You tanked CSAT under 75% and wiped out the entire bonus—that’s painful math!',
        'Poof! Under 75% CSAT and the whole bonus payout goes straight to zero!',
        'A CSAT below 75% kills the entire bonus—don’t look at me, the math doesn’t lie!',
        'The whole bonus pot just went up in smoke under 75% CSAT!',
        'Below 75% CSAT wipes out all bonus gold—what a disaster for the pouch!'
      ],
      penalty_aht: [
        'AHT over 32m—boom, minus €50! Slow hands cost real gold!',
        'Past 32m AHT shaves €50 straight off the top. Speed up or pay up!',
        'Over 32 minutes AHT?! *Click-clack*—there goes €50 right out of your pocket!',
        'Dragging AHT past 32m is a €50 bleed—wrap ’em up before more gold leaks!',
        'Past 32m AHT and the ledger charges a €50 slowpoke fee!',
        'AHT above 32m docks €50—taking forever is terrible for the bottom line!',
        'Over 32 minutes AHT costs €50—hurry up and stop burning money!',
        'Slow pace past 32m AHT shaves €50 straight off the reward!',
        'AHT over 32m is costing €50—every extra minute hurts the pouch!',
        'Past 32m AHT docks €50—move faster if you like keeping your coins!',
        'Over 32 minutes AHT triggers a €50 penalty—ouch!',
        'AHT above 32m takes €50 right off the top.'
      ],
      penalty_rr: [
        'RR below 84%—minus €25! Fix ’em once so they stop gnawing the gold!',
        'Under 84% RR triggers a €25 penalty. Stop letting cases bounce back!',
        'Below 84% RR?! *Snip*—minus €25 for repeat headaches!',
        'Repeat rate under 84% costs €25—do it clean once and keep the coin!',
        'Under 84% RR docks €25—bounce-backs are expensive business!',
        'RR below 84% shaves €25 off the tally—fix ’em right the first time!',
        'Below 84% RR costs €25—repeat issues chew right through the bonus!',
        'Under 84% RR is a €25 hit—stop letting old cases come back!',
        'RR beneath 84% docks €25—sloppy fixes cost real money!',
        'Below 84% RR takes €25 out of the pot—clean it up!',
        'Under 84% RR costs €25—bad math for the pouch!',
        'RR below 84% triggers a €25 deduction.'
      ],
      combined_woes: [
        'Ooh, bad math stacking up—multiple penalties and misses biting the payout!',
        'Several hits at once! The bonus pot is getting chewed from every side.',
        'Yikes—multiple shortfalls and penalties piling up at once! The math is ugly!',
        'Several metrics are biting the payout at once—that pouch is taking a beating!',
        'Stacked misses and penalties right now—the numbers are chewing through the bonus!',
        'Multiple hits on the ledger at once—bad news for the bottom line!',
        'Several metrics are hurting the payout together—the math looks rough!',
        'Multiple faults stacking up at once—the bonus pot is shrinking fast!',
        'Several lines are dragging the payout down together—ouch!',
        'Stacked problems hitting the tally at once—ugly arithmetic!',
        'Multiple misses and hits at once—the pouch feels every single one!',
        'Several metrics are bleeding value together right now!'
      ],
      approaching: [
        'Right next to a payout line—don’t fumble it before the tally locks!',
        'So close to a bonus bump—one clean push could mean extra coin.',
        'You’re right beside a bonus line—don’t drop the coin right before the finish!',
        'One clean push could unlock a bonus bump—don’t choke now!',
        'Right next to a threshold—so close to extra gold!',
        'Barely shy of a payout line—one good move could grab the coin!',
        'Right on the edge of a bonus bump—keep it together!',
        'Almost at a payout threshold—don’t fumble the bag now!',
        'So close to a bonus line—one sharp push could pay off!',
        'Right next to a threshold—don’t slip at the last second!',
        'Nearly at a bonus mark—keep pushing for that extra coin!',
        'Right beside a payout threshold—finish clean!'
      ],
      reward_earned: [
        'Cha-ching! Threshold cleared—that’s real bonus gold earned!',
        'Nice! You hit the mark and unlocked a tidy slice of bonus.',
        'Cha-ching! Target hit and bonus coin added to the pile!',
        'Now THAT’S better math—threshold cleared and extra gold earned!',
        'A clean threshold hit puts real bonus coin on the board!',
        'Boom—target cleared and bonus gold unlocked!',
        'Cha-ching! You hit the mark and claimed a bonus bump!',
        'Good numbers! Threshold cleared and extra coin earned!',
        'That’s proper gold math—target met and bonus added!',
        'Cha-ching! The ledger pays out on that threshold clear!',
        'Nice clear on that mark—extra bonus coin in sight!',
        'Target hit clean—real bonus value unlocked!'
      ],
      reward_missed: [
        'Missed the bonus line—no extra gold for "almost," cheeky mortal!',
        'Just short of the threshold; the extra coin stays right where it is.',
        'No extra coin there—you missed the bonus line!',
        'Missed the threshold—close doesn’t put gold in the pouch!',
        'Just shy of the bonus mark—no extra gold paid out there.',
        'Missed that bonus line—the ledger keeps its extra coin!',
        'Short of the threshold—no bonus gold earned on that one.',
        'Missed the mark—no extra coin for near-misses!',
        'Just short of the bonus threshold—no payout bump there.',
        'Missed that target line—the extra gold stays locked.',
        'No bonus coin there—you came up short of the threshold.',
        'Missed the bonus mark—better luck next time!'
      ],
      excellent: [
        'Look at those clean numbers—top marks and the full €300 pot in sight!',
        'Every metric firing right—best kind of math there is!',
        'Now that’s gorgeous arithmetic—every metric clean and the full €300 in sight!',
        'Every single metric’s looking sharp—top-tier gold math right there!',
        'Clean numbers across the board—the full €300 pot is looking mighty fine!',
        'Every metric’s hitting right—best kind of numbers in the book!',
        'Top marks across the board—the ledger’s practically purring!',
        'Every measure’s clean and strong—full €300 potential shining bright!',
        'Sweet, clean numbers across every metric—top-grade math!',
        'Every line’s firing right—the full €300 reward is wide open!',
        'Clean, crisp numbers across the board—love to see it!',
        'Every metric’s in great shape—top-notch gold math!'
      ],
      poor: [
        'Ouch—weak scores and heavy drag are starving the bonus pot.',
        'Not pretty math—several numbers are lagging behind target.',
        'Oof—weak numbers across the board are starving the pouch!',
        'Rough math right now—several metrics are lagging bad.',
        'The numbers are looking thin—several lines are hurting the bonus pot.',
        'Not great math across the board—lots of lagging numbers right now.',
        'Weak scores across key lines—the pouch is feeling the pinch.',
        'Ugly numbers across several metrics—plenty of ground to make up.',
        'The tally’s running thin—several numbers are well behind.',
        'Weak metrics across the board—not the happiest math for the pouch.',
        'Lagging numbers across key lines—the bonus pot’s taking a hit.',
        'Not pretty arithmetic—several metrics need serious work.'
      ]
    }
  };

  const PERSONALITY_KEYS = Object.keys(PERSONALITIES);

  function pickFrom(arr) {
    if (!Array.isArray(arr) || !arr.length) return '';
    return arr[Math.floor(Math.random() * arr.length)];
  }

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

  function pickPersonalityKey() {
    const unused = PERSONALITY_KEYS.filter(k => !recentPersonalities.includes(k));
    const pool = unused.length ? unused : PERSONALITY_KEYS;
    const chosen = pickFrom(pool);
    const pos = recentPersonalities.indexOf(chosen);
    if (pos !== -1) recentPersonalities.splice(pos, 1);
    recentPersonalities.push(chosen);
    const keepCount = Math.min(3, Math.max(1, PERSONALITY_KEYS.length - 1));
    while (recentPersonalities.length > keepCount) recentPersonalities.shift();
    return chosen;
  }

  function isNear(val, target, tolerance) {
    return typeof val === 'number' && !isNaN(val) && Math.abs(val - target) <= tolerance;
  }

  function getTabIdentity(tab) {
    if (!tab) return 'no-tab';
    if (tab.id !== undefined && tab.id !== null && String(tab.id).trim() !== '') {
      return String(tab.id);
    }
    return `name:${tab.name || ''}`;
  }

  function quantizeMetric(val) {
    if (val === null || val === undefined || typeof val !== 'number' || isNaN(val)) return null;
    return Number(val.toFixed(4));
  }

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

  function buildCacheKey(tab, metrics) {
    return `${getTabIdentity(tab)}::${buildSnapshot(tab, metrics)}`;
  }

  function deriveOverallBand(category, metrics, definedCount, options) {
    const opts = options || {};
    const count = typeof definedCount === 'number' && !isNaN(definedCount) ? definedCount : 0;

    if (metrics && metrics.forfeited) {
      return 'catastrophic';
    }

    if (count < 5) {
      return 'indeterminate';
    }

    if (category === 'excellent') {
      return 'excellent';
    }

    if (category === 'poor' || category === 'penalty_aht' || category === 'penalty_rr' || category === 'combined_woes') {
      return 'poor';
    }

    if (opts.hasSevereWoe || (typeof opts.woeCount === 'number' && opts.woeCount >= 2)) {
      return 'poor';
    }

    if (category === 'reward_earned') {
      return 'good';
    }

    if (category === 'approaching' || category === 'reward_missed' || opts.hasApproaching) {
      return 'borderline';
    }

    return 'borderline';
  }

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

    if (!hasAnyData || definedCount === 0) {
      return {
        category: 'empty',
        overallBand: deriveOverallBand('empty', metrics, definedCount),
        severity: 'neutral',
        focusMetric: null,
        snapshot
      };
    }

    if (metrics.forfeited) {
      return {
        category: 'forfeited',
        overallBand: deriveOverallBand('forfeited', metrics, definedCount),
        severity: 'high',
        focusMetric: 'csat',
        snapshot
      };
    }

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

  function formatMetricClause(focusMetric, metrics) {
    if (!focusMetric || focusMetric === 'overall') return '';
    if (focusMetric === 'csat' && metrics.csatPct !== null && !isNaN(metrics.csatPct)) {
      return ` [CSAT ${metrics.csatPct.toFixed(1)}%]`;
    }
    if (focusMetric === 'aht' && metrics.avgAht !== null && !isNaN(metrics.avgAht)) {
      return ` [AHT ${metrics.avgAht.toFixed(1)}m]`;
    }
    if (focusMetric === 'crt' && metrics.crtPct !== null && !isNaN(metrics.crtPct)) {
      return ` [CRT NE ${metrics.crtPct.toFixed(1)}%]`;
    }
    if (focusMetric === 'rr' && metrics.rrPct !== null && !isNaN(metrics.rrPct)) {
      return ` [RR ${metrics.rrPct.toFixed(1)}%]`;
    }
    if (focusMetric === 'sqs' && metrics.avgQual !== null && !isNaN(metrics.avgQual)) {
      return ` [SQS ${metrics.avgQual.toFixed(1)}%]`;
    }
    return '';
  }

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
    const pKey = pickPersonalityKey();
    const persona = PERSONALITIES[pKey];

    const pool = persona[analysis.category] || persona.partial || ['The ledger shifts quietly.'];
    const line = pickNonRepeating(pool, `${pKey}:${analysis.category}`);
    const opener = analysis.category === 'empty' ? '' : `${pickNonRepeating(persona.openers, `${pKey}:open`)} `;
    const statTag = formatMetricClause(analysis.focusMetric, m);

    const safeQuote = escapeHtml(`“${opener}${line}${statTag}”`);
    const safeVoice = escapeHtml(persona.id);
    const safeState = escapeHtml(analysis.category);
    const safeBand = escapeHtml(analysis.overallBand);
    const safeChronicle = escapeHtml(tab.name || '');

    lastCacheKey = cacheKey;
    lastRenderedMarkup = `<div class="oracle-quote-only" data-oracle-voice="${safeVoice}" data-oracle-state="${safeState}" data-oracle-band="${safeBand}" data-oracle-chronicle="${safeChronicle}"><span class="oracle-rune-divider">✦ ─── ✦</span>${safeQuote}<span class="oracle-rune-divider">✦ ─── ✦</span></div>`;

    return lastRenderedMarkup;
  }

  function prefersReducedMotion() {
    return Boolean(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* Refined Arcane Seal: Fine concentric geometry, runic/alchemical detailing, controlled glow */
  function forgeProceduralSeal() {
    const pKey = pickPersonalityKey();
    const seed = Math.floor(Math.random() * 9000) + 1000;
    const uid = `seal_${pKey}_${seed}`;
    const tickCount = 12;
    const reduced = prefersReducedMotion();

    const radialTicks = [];
    for (let i = 0; i < tickCount; i++) {
      const deg = i * (360 / tickCount);
      const rad = (deg * Math.PI) / 180;
      const r1 = i % 3 === 0 ? 44 : 46.5;
      const r2 = 50.5;
      const x1 = (60 + r1 * Math.cos(rad)).toFixed(2);
      const y1 = (60 + r1 * Math.sin(rad)).toFixed(2);
      const x2 = (60 + r2 * Math.cos(rad)).toFixed(2);
      const y2 = (60 + r2 * Math.sin(rad)).toFixed(2);
      radialTicks.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="seal-tick-line" />`);
    }

    const cardinalNodes = [];
    for (let j = 0; j < 4; j++) {
      const ang = (j * Math.PI) / 2;
      const nx = (60 + 38.5 * Math.cos(ang)).toFixed(2);
      const ny = (60 + 38.5 * Math.sin(ang)).toFixed(2);
      cardinalNodes.push(`<circle cx="${nx}" cy="${ny}" r="1.65" class="seal-node-pin" />`);
    }

    return `
      <div class="arcane-manifestation${reduced ? ' reduced-motion' : ''}" data-manifest-seed="${seed}" aria-hidden="true">
        <div class="manifest-bloom"></div>
        <svg class="manifest-svg" viewBox="0 0 120 120">
          <defs>
            <radialGradient id="${uid}_aura" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stop-color="#d97706" stop-opacity="0.22" />
              <stop offset="58%" stop-color="#6d28d9" stop-opacity="0.12" />
              <stop offset="100%" stop-color="#0f172a" stop-opacity="0" />
            </radialGradient>
          </defs>

          <circle cx="60" cy="60" r="55" fill="url(#${uid}_aura)" class="manifest-layer-pulse-slow" />

          <g class="manifest-ring-outer">
            <circle cx="60" cy="60" r="50.5" class="seal-ring-fine" />
            <circle cx="60" cy="60" r="46.5" class="seal-ring-hairline" />
            ${radialTicks.join('')}
            ${cardinalNodes.join('')}
          </g>

          <g class="manifest-ring-inner">
            <circle cx="60" cy="60" r="38.5" class="seal-ring-fine" />
            <circle cx="60" cy="60" r="31" class="seal-ring-dashed" />
            <polygon points="60,29 86.8,75.5 33.2,75.5" class="seal-tri-primary" />
            <polygon points="60,91 86.8,44.5 33.2,44.5" class="seal-tri-secondary" />
          </g>

          <g class="manifest-core-sigil">
            <circle cx="60" cy="60" r="17" class="seal-core-ring" />
            <circle cx="60" cy="60" r="11" class="seal-core-inner" />
            <line x1="60" y1="43" x2="60" y2="77" class="seal-axis-line" />
            <line x1="43" y1="60" x2="77" y2="60" class="seal-axis-line" />
            <circle cx="60" cy="60" r="3.2" class="seal-core-pivot" />
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
