/**
 * Company marks for the hero wall.
 *
 * No ATS publishes a logo or a domain. Greenhouse reports a display name, Lever
 * and Ashby report nothing at all — the label on those is the board token, which
 * is how "hinge-health" and "airwallex" end up on screen. So both halves of a
 * chip have to come from somewhere else, and this is that somewhere.
 *
 * It is deliberately a hand-checked list rather than a guess. Deriving a domain
 * from the token (`${token}.com`) is right often enough to be dangerous: it puts
 * a travel site's logo on Away, a hardware brand's on Zip, and a wrong mark is
 * worse than no mark. Every domain here was verified to return a real icon.
 *
 * Coverage is not the goal — the sweep finds ~1,700 boards and no hand list will
 * ever catch them. It only has to cover the names worth showing; anything
 * unmapped falls back to a monogram and stays out of the wall.
 */

import type { Company } from './types';

export type Brand = {
  /** How the company writes itself, which is rarely how the board token spells it. */
  name: string;
  /** Registrable domain — the key the icon service resolves against. */
  domain: string;
};

/**
 * Keyed by `${source}:${token}`, not by token alone. Tokens collide across
 * platforms and mean different companies when they do.
 */
export const BRANDS: Record<string, Brand> = {
  /* ---------------------------------------------------------- greenhouse */
  'greenhouse:stripe': { name: 'Stripe', domain: 'stripe.com' },
  'greenhouse:figma': { name: 'Figma', domain: 'figma.com' },
  'greenhouse:okta': { name: 'Okta', domain: 'okta.com' },
  'greenhouse:oura': { name: 'Ōura', domain: 'ouraring.com' },
  'greenhouse:duolingo': { name: 'Duolingo', domain: 'duolingo.com' },
  'greenhouse:datadog': { name: 'Datadog', domain: 'datadoghq.com' },
  'greenhouse:brex': { name: 'Brex', domain: 'brex.com' },
  'greenhouse:oscar': { name: 'Oscar Health', domain: 'hioscar.com' },
  'greenhouse:lyft': { name: 'Lyft', domain: 'lyft.com' },
  'greenhouse:robinhood': { name: 'Robinhood', domain: 'robinhood.com' },
  'greenhouse:gusto': { name: 'Gusto', domain: 'gusto.com' },
  'greenhouse:dropbox': { name: 'Dropbox', domain: 'dropbox.com' },
  'greenhouse:justworks': { name: 'Justworks', domain: 'justworks.com' },
  'greenhouse:peloton': { name: 'Peloton', domain: 'onepeloton.com' },
  'greenhouse:mercury': { name: 'Mercury', domain: 'mercury.com' },
  'greenhouse:zocdoc': { name: 'Zocdoc', domain: 'zocdoc.com' },
  'greenhouse:pinterest': { name: 'Pinterest', domain: 'pinterest.com' },
  'greenhouse:asana': { name: 'Asana', domain: 'asana.com' },
  'greenhouse:instacart': { name: 'Instacart', domain: 'instacart.com' },
  'greenhouse:monzo': { name: 'Monzo', domain: 'monzo.com' },
  'greenhouse:wrike': { name: 'Wrike', domain: 'wrike.com' },
  'greenhouse:chime': { name: 'Chime', domain: 'chime.com' },
  'greenhouse:samsara': { name: 'Samsara', domain: 'samsara.com' },
  'greenhouse:vercel': { name: 'Vercel', domain: 'vercel.com' },
  'greenhouse:discord': { name: 'Discord', domain: 'discord.com' },
  'greenhouse:databricks': { name: 'Databricks', domain: 'databricks.com' },
  'greenhouse:adyen': { name: 'Adyen', domain: 'adyen.com' },
  'greenhouse:gitlab': { name: 'GitLab', domain: 'gitlab.com' },
  'greenhouse:affirm': { name: 'Affirm', domain: 'affirm.com' },
  'greenhouse:twilio': { name: 'Twilio', domain: 'twilio.com' },
  'greenhouse:coinbase': { name: 'Coinbase', domain: 'coinbase.com' },
  'greenhouse:smartsheet': { name: 'Smartsheet', domain: 'smartsheet.com' },
  'greenhouse:faire': { name: 'Faire', domain: 'faire.com' },
  'greenhouse:airtable': { name: 'Airtable', domain: 'airtable.com' },
  'greenhouse:elastic': { name: 'Elastic', domain: 'elastic.co' },
  'greenhouse:remotecom': { name: 'Remote', domain: 'remote.com' },
  'greenhouse:airbnb': { name: 'Airbnb', domain: 'airbnb.com' },
  'greenhouse:reddit': { name: 'Reddit', domain: 'reddit.com' },
  'greenhouse:sezzle': { name: 'Sezzle', domain: 'sezzle.com' },
  'greenhouse:n26': { name: 'N26', domain: 'n26.com' },
  'greenhouse:amplitude': { name: 'Amplitude', domain: 'amplitude.com' },
  'greenhouse:stockx': { name: 'StockX', domain: 'stockx.com' },
  'greenhouse:webflow': { name: 'Webflow', domain: 'webflow.com' },
  'greenhouse:lightricks': { name: 'Lightricks', domain: 'lightricks.com' },
  'greenhouse:netlify': { name: 'Netlify', domain: 'netlify.com' },
  'greenhouse:calm': { name: 'Calm', domain: 'calm.com' },
  'greenhouse:coreweave': { name: 'CoreWeave', domain: 'coreweave.com' },
  'greenhouse:typeface': { name: 'Typeface', domain: 'typeface.ai' },
  'greenhouse:chainguard': { name: 'Chainguard', domain: 'chainguard.dev' },
  'greenhouse:hightouch': { name: 'Hightouch', domain: 'hightouch.com' },
  'greenhouse:fivetran': { name: 'Fivetran', domain: 'fivetran.com' },
  'greenhouse:gemini': { name: 'Gemini', domain: 'gemini.com' },
  'greenhouse:make': { name: 'Make', domain: 'make.com' },
  'greenhouse:customerio': { name: 'Customer.io', domain: 'customer.io' },
  'greenhouse:klaviyo': { name: 'Klaviyo', domain: 'klaviyo.com' },
  'greenhouse:glossier': { name: 'Glossier', domain: 'glossier.com' },
  'greenhouse:epicgames': { name: 'Epic Games', domain: 'epicgames.com' },
  'greenhouse:riotgames': { name: 'Riot Games', domain: 'riotgames.com' },
  'greenhouse:spacex': { name: 'SpaceX', domain: 'spacex.com' },
  'greenhouse:2k': { name: '2K', domain: '2k.com' },
  'greenhouse:andurilindustries': { name: 'Anduril', domain: 'anduril.com' },
  'greenhouse:ideo': { name: 'IDEO', domain: 'ideo.com' },
  'greenhouse:pandadoc': { name: 'PandaDoc', domain: 'pandadoc.com' },
  'greenhouse:zyngacareers': { name: 'Zynga', domain: 'zynga.com' },
  'greenhouse:scopely': { name: 'Scopely', domain: 'scopely.com' },
  'greenhouse:ixllearning': { name: 'IXL Learning', domain: 'ixl.com' },
  'greenhouse:thenewyorktimes': { name: 'The New York Times', domain: 'nytimes.com' },
  'greenhouse:urbancompass': { name: 'Compass', domain: 'compass.com' },
  // The careers host, because coupang.com itself serves no icon the service can find.
  'greenhouse:coupang': { name: 'Coupang', domain: 'coupang.jobs' },
  'greenhouse:esri': { name: 'Esri', domain: 'esri.com' },
  'greenhouse:alphasense': { name: 'AlphaSense', domain: 'alpha-sense.com' },
  'greenhouse:agoda': { name: 'Agoda', domain: 'agoda.com' },
  'greenhouse:devrev': { name: 'DevRev', domain: 'devrev.ai' },
  'greenhouse:intercom': { name: 'Intercom', domain: 'intercom.com' },
  'greenhouse:verkada': { name: 'Verkada', domain: 'verkada.com' },
  'greenhouse:xometry': { name: 'Xometry', domain: 'xometry.com' },
  'greenhouse:sonyinteractiveentertainmentglobal': { name: 'PlayStation', domain: 'playstation.com' },
  'greenhouse:naughtydog': { name: 'Naughty Dog', domain: 'naughtydog.com' },
  'greenhouse:hellofresh': { name: 'HelloFresh', domain: 'hellofresh.com' },
  'greenhouse:onrunning': { name: 'On', domain: 'on-running.com' },
  'greenhouse:quince': { name: 'Quince', domain: 'onequince.com' },
  'greenhouse:securityscorecard': { name: 'SecurityScorecard', domain: 'securityscorecard.com' },
  'greenhouse:smartlyio': { name: 'Smartly', domain: 'smartly.io' },
  'greenhouse:babylist': { name: 'Babylist', domain: 'babylist.com' },
  'greenhouse:canonical': { name: 'Canonical', domain: 'canonical.com' },
  'greenhouse:axon': { name: 'Axon', domain: 'axon.com' },
  'greenhouse:dialpad': { name: 'Dialpad', domain: 'dialpad.com' },
  'greenhouse:ogilvy': { name: 'Ogilvy', domain: 'ogilvy.com' },
  'greenhouse:sumup': { name: 'SumUp', domain: 'sumup.com' },
  'greenhouse:redwoodmaterials': { name: 'Redwood Materials', domain: 'redwoodmaterials.com' },
  'greenhouse:interbrand': { name: 'Interbrand', domain: 'interbrand.com' },
  'greenhouse:deepmind': { name: 'DeepMind', domain: 'deepmind.google' },
  'greenhouse:proton': { name: 'Proton', domain: 'proton.me' },
  'greenhouse:rubrik': { name: 'Rubrik', domain: 'rubrik.com' },
  'greenhouse:psiquantum': { name: 'PsiQuantum', domain: 'psiquantum.com' },
  'greenhouse:jetbrains': { name: 'JetBrains', domain: 'jetbrains.com' },
  'greenhouse:doordashusa': { name: 'DoorDash', domain: 'doordash.com' },
  'greenhouse:checkr': { name: 'Checkr', domain: 'checkr.com' },
  'greenhouse:gleanwork': { name: 'Glean', domain: 'glean.com' },
  'greenhouse:formlabs': { name: 'Formlabs', domain: 'formlabs.com' },
  'greenhouse:geotab': { name: 'Geotab', domain: 'geotab.com' },
  'greenhouse:helsing': { name: 'Helsing', domain: 'helsing.ai' },
  'greenhouse:majorleaguebaseball': { name: 'Major League Baseball', domain: 'mlb.com' },
  'greenhouse:nebius': { name: 'Nebius', domain: 'nebius.com' },
  'greenhouse:onetrust': { name: 'OneTrust', domain: 'onetrust.com' },
  'greenhouse:dept': { name: 'DEPT®', domain: 'deptagency.com' },
  'greenhouse:monks': { name: 'Monks', domain: 'monks.com' },
  'greenhouse:wundermanthompson': { name: 'VML', domain: 'vml.com' },
  'greenhouse:akqa': { name: 'AKQA', domain: 'akqa.com' },
  'greenhouse:landor': { name: 'Landor', domain: 'landor.com' },
  'greenhouse:valtech': { name: 'Valtech', domain: 'valtech.com' },
  'greenhouse:mavenclinic': { name: 'Maven Clinic', domain: 'mavenclinic.com' },
  'greenhouse:metalab': { name: 'MetaLab', domain: 'metalab.com' },
  'greenhouse:generalassembly': { name: 'General Assembly', domain: 'generalassemb.ly' },
  'greenhouse:redventures': { name: 'Red Ventures', domain: 'redventures.com' },
  'greenhouse:flohealth': { name: 'Flo Health', domain: 'flo.health' },
  'greenhouse:bitpanda': { name: 'Bitpanda', domain: 'bitpanda.com' },
  'greenhouse:casetify': { name: 'CASETiFY', domain: 'casetify.com' },
  'greenhouse:cresta': { name: 'Cresta', domain: 'cresta.ai' },
  'greenhouse:parloa': { name: 'Parloa', domain: 'parloa.com' },
  'greenhouse:feverup': { name: 'Fever', domain: 'feverup.com' },
  'greenhouse:fundraiseup': { name: 'Fundraise Up', domain: 'fundraiseup.com' },
  'greenhouse:okx': { name: 'OKX', domain: 'okx.com' },
  'greenhouse:sharkninjaoperatingllc': { name: 'SharkNinja', domain: 'sharkninja.com' },
  'greenhouse:newsela': { name: 'Newsela', domain: 'newsela.com' },
  'greenhouse:xpinc': { name: 'XP Inc.', domain: 'xpinc.com' },
  'greenhouse:tide': { name: 'Tide', domain: 'tide.co' },
  'greenhouse:alfredbeneschco': { name: 'Benesch', domain: 'benesch.com' },
  'greenhouse:dlrgroup': { name: 'DLR Group', domain: 'dlrgroup.com' },
  'greenhouse:cannondesign': { name: 'CannonDesign', domain: 'cannondesign.com' },

  /* --------------------------------------------------------------- lever */
  'lever:palantir': { name: 'Palantir', domain: 'palantir.com' },
  'lever:spotify': { name: 'Spotify', domain: 'spotify.com' },
  'lever:shieldai': { name: 'Shield AI', domain: 'shield.ai' },
  'lever:matchgroup': { name: 'Match Group', domain: 'mtch.com' },
  'lever:bumbleinc': { name: 'Bumble', domain: 'bumble.com' },
  'lever:binance': { name: 'Binance', domain: 'binance.com' },
  'lever:larian': { name: 'Larian Studios', domain: 'larian.com' },
  'lever:brooksrunning': { name: 'Brooks Running', domain: 'brooksrunning.com' },
  'lever:pointclickcare': { name: 'PointClickCare', domain: 'pointclickcare.com' },
  'lever:logrocket': { name: 'LogRocket', domain: 'logrocket.com' },
  'lever:wealthfront': { name: 'Wealthfront', domain: 'wealthfront.com' },
  'lever:gopuff': { name: 'Gopuff', domain: 'gopuff.com' },
  'lever:peakgames': { name: 'Peak', domain: 'peak.com' },

  /* --------------------------------------------------------------- ashby */
  'ashby:airwallex': { name: 'Airwallex', domain: 'airwallex.com' },
  'ashby:whoop': { name: 'WHOOP', domain: 'whoop.com' },
  'ashby:harvey': { name: 'Harvey', domain: 'harvey.ai' },
  'ashby:sierra': { name: 'Sierra', domain: 'sierra.ai' },
  'ashby:snowflake': { name: 'Snowflake', domain: 'snowflake.com' },
  'ashby:ramp': { name: 'Ramp', domain: 'ramp.com' },
  'ashby:zip': { name: 'Zip', domain: 'ziphq.com' },
  'ashby:notion': { name: 'Notion', domain: 'notion.com' },
  'ashby:miro': { name: 'Miro', domain: 'miro.com' },
  'ashby:strava': { name: 'Strava', domain: 'strava.com' },
  'ashby:linear': { name: 'Linear', domain: 'linear.app' },
  'ashby:supabase': { name: 'Supabase', domain: 'supabase.com' },
  'ashby:thumbtack': { name: 'Thumbtack', domain: 'thumbtack.com' },
  'ashby:abridge': { name: 'Abridge', domain: 'abridge.com' },
  'ashby:mural': { name: 'Mural', domain: 'mural.co' },
  'ashby:plaid': { name: 'Plaid', domain: 'plaid.com' },
  'ashby:clickup': { name: 'ClickUp', domain: 'clickup.com' },
  'ashby:angi': { name: 'Angi', domain: 'angi.com' },
  'ashby:poshmark': { name: 'Poshmark', domain: 'poshmark.com' },
  'ashby:oyster': { name: 'Oyster', domain: 'oysterhr.com' },
  'ashby:capsule': { name: 'Capsule', domain: 'capsule.com' },
  'ashby:runpod': { name: 'RunPod', domain: 'runpod.io' },
  'ashby:synthesia': { name: 'Synthesia', domain: 'synthesia.io' },
  'ashby:deepgram': { name: 'Deepgram', domain: 'deepgram.com' },
  'ashby:elevenlabs': { name: 'ElevenLabs', domain: 'elevenlabs.io' },
  'ashby:baseten': { name: 'Baseten', domain: 'baseten.co' },
  'ashby:vanta': { name: 'Vanta', domain: 'vanta.com' },
  'ashby:socket': { name: 'Socket', domain: 'socket.dev' },
  'ashby:workos': { name: 'WorkOS', domain: 'workos.com' },
  'ashby:resend': { name: 'Resend', domain: 'resend.com' },
  'ashby:stytch': { name: 'Stytch', domain: 'stytch.com' },
  'ashby:zed': { name: 'Zed', domain: 'zed.dev' },
  'ashby:secureframe': { name: 'Secureframe', domain: 'secureframe.com' },
  'ashby:bubble': { name: 'Bubble', domain: 'bubble.io' },
  'ashby:phantom': { name: 'Phantom', domain: 'phantom.com' },
  'ashby:opensea': { name: 'OpenSea', domain: 'opensea.io' },
  'ashby:alchemy': { name: 'Alchemy', domain: 'alchemy.com' },
  'ashby:uniswap': { name: 'Uniswap', domain: 'uniswap.org' },
  'ashby:headway': { name: 'Headway', domain: 'headway.co' },
  'ashby:gamma': { name: 'Gamma', domain: 'gamma.app' },
  'ashby:n8n': { name: 'n8n', domain: 'n8n.io' },
  'ashby:away': { name: 'Away', domain: 'awaytravel.com' },
  'ashby:betterup': { name: 'BetterUp', domain: 'betterup.com' },
  'ashby:lightspeedhq': { name: 'Lightspeed', domain: 'lightspeedhq.com' },
  'ashby:pennylane': { name: 'Pennylane', domain: 'pennylane.com' },
  'ashby:suno': { name: 'Suno', domain: 'suno.com' },
  'ashby:eightsleep': { name: 'Eight Sleep', domain: 'eightsleep.com' },
  'ashby:handshake': { name: 'Handshake', domain: 'joinhandshake.com' },
  'ashby:hinge-health': { name: 'Hinge Health', domain: 'hingehealth.com' },
  'ashby:legora': { name: 'Legora', domain: 'legora.com' },
  'ashby:speak': { name: 'Speak', domain: 'speak.com' },
  'ashby:profound': { name: 'Profound', domain: 'tryprofound.com' },
  'ashby:rho': { name: 'Rho', domain: 'rho.co' },
  'ashby:voodoo': { name: 'Voodoo', domain: 'voodoo.io' },
  'ashby:faculty': { name: 'Faculty', domain: 'faculty.ai' },
  'ashby:owner': { name: 'Owner', domain: 'owner.com' },
  'ashby:plaud': { name: 'PLAUD', domain: 'plaud.ai' },
  'ashby:permitflow': { name: 'PermitFlow', domain: 'permitflow.com' },
  'ashby:superpower': { name: 'Superpower', domain: 'superpower.com' },
  'ashby:tempo': { name: 'Tempo', domain: 'tempo.io' },
};

/**
 * Where the marks come from.
 *
 * DuckDuckGo's icon service, because it is the one that answers honestly: a
 * domain it has never seen 404s, which is what lets a broken mark fall back to a
 * monogram. Google's equivalent returns a grey globe with a 200 and there is no
 * way to tell that apart from a real icon.
 */
export function markUrl(domain: string): string {
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}

export const brandFor = (key: string): Brand | undefined => BRANDS[key];

/** The letter shown while an icon loads, and instead of one that never arrives. */
export function monogram(name: string): string {
  const first = name.trim().replace(/^[^\p{L}\p{N}]+/u, '').charAt(0);
  return (first || name.trim().charAt(0) || '?').toUpperCase();
}

export type WallEntry = {
  key: string;
  name: string;
  domain: string;
  /** Open postings behind this company right now — the wall's sort order. */
  count: number;
};

/**
 * The companies the wall shows, best first.
 *
 * Sorted by open postings rather than alphabetically: the wall is a claim about
 * where the roles are coming from, so the boards actually producing them belong
 * at the front. Unmapped boards are dropped — see the note at the top of the
 * file — which is also what keeps a wall of agency subdomains and staffing
 * shells off the front of the page.
 */
export function wallEntries(
  companies: Company[],
  counts: Map<string, number>,
  limit: number,
): WallEntry[] {
  const out: WallEntry[] = [];

  for (const company of companies) {
    const brand = BRANDS[company.key];
    if (!brand) continue;
    out.push({
      key: company.key,
      name: brand.name,
      domain: brand.domain,
      count: counts.get(company.key) ?? 0,
    });
  }

  out.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  return out.slice(0, limit);
}
