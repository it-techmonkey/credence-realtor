/**
 * Fetch payment_plans from Alnair project/look API for each slug in all_data_uae_en.json
 * Writes src/data/payment-plans.json
 *
 * Usage:
 * node scripts/fetch-payment-plans.js
 * node scripts/fetch-payment-plans.js --limit 100
 * node scripts/fetch-payment-plans.js --delay 2000
 * node scripts/fetch-payment-plans.js --debug
 */

const path = require("path");
const fs = require("fs");

require("dotenv").config({
  path: path.join(__dirname, "..", ".env.local"),
});

const API = "https://api.alnair.ae/project/look";

const args = process.argv.slice(2);

const limitIdx = args.indexOf("--limit");
const delayIdx = args.indexOf("--delay");

const DEBUG = args.includes("--debug");

const LIMIT =
  limitIdx >= 0 && args[limitIdx + 1]
    ? parseInt(args[limitIdx + 1], 10)
    : null;

const DELAY =
  delayIdx >= 0 && args[delayIdx + 1]
    ? parseInt(args[delayIdx + 1], 10)
    : 1500;

const COOKIE =
  process.env.ALNAIR_CF_CLEARANCE_COOKIE ||
  "cf_clearance=PASTE_COOKIE_FROM_BROWSER";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function getHeaders() {
  return {
    "accept":
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "accept-language": "en-GB,en;q=0.8",
    "cache-control": "max-age=0",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
    "user-agent":
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1",
    "cookie": process.env.ALNAIR_COOKIE
  };
}

async function fetchProject(slug, log = false) {
  const url = `${API}/${encodeURIComponent(slug)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: getHeaders(),
  });

  if (log) {
    console.log(`GET ${slug} -> ${res.status}`);
  }

  if (res.status === 429) {
    return { rateLimited: true };
  }

  if (!res.ok) {
    return null;
  }

  return await res.json();
}

function getPayload(data) {
  if (!data) return null;

  return data.data ?? data.project ?? data;
}

function extractPaymentPlans(data) {
  const payload = getPayload(data);

  if (!payload) return null;

  const plans =
    payload.payment_plans ||
    data.payment_plans ||
    data.data?.payment_plans ||
    data.project?.payment_plans;

  if (!Array.isArray(plans) || plans.length === 0) return null;

  return plans;
}

function debugResponse(data, slug) {
  const payload = getPayload(data);

  console.log("\nDEBUG RESPONSE SHAPE");
  console.log("Slug:", slug);

  console.log("Top keys:", Object.keys(data));

  if (payload) {
    console.log("Payload keys:", Object.keys(payload));

    if (payload.payment_plans) {
      console.log(
        "payment_plans length:",
        payload.payment_plans.length
      );
    }
  }

  const debugPath = path.join(
    __dirname,
    "..",
    "src/data/payment-plans-debug-sample.json"
  );

  fs.writeFileSync(debugPath, JSON.stringify(data, null, 2));
}

async function main() {
  const dataPath = path.join(
    __dirname,
    "..",
    "src/data/all_data_uae_en.json"
  );

  const outPath = path.join(
    __dirname,
    "..",
    "src/data/payment-plans.json"
  );

  if (!fs.existsSync(dataPath)) {
    console.error("all_data_uae_en.json not found");
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(dataPath, "utf8"));

  const items = raw?.data?.items || [];

  const slugs = [...new Set(items.map((p) => p.slug).filter(Boolean))];

  const toProcess = LIMIT ? slugs.slice(0, LIMIT) : slugs;

  console.log(
    `Found ${slugs.length} slugs. Processing ${toProcess.length}`
  );

  const paymentPlansMap = {};

  let success = 0;
  let done = 0;
  let loggedShape = false;

  for (const slug of toProcess) {
    try {
      const data = await fetchProject(slug, done === 0 || DEBUG);

      if (data?.rateLimited) {
        console.log("Rate limited, waiting 60s...");
        await sleep(60000);
        continue;
      }

      if (!data && done === 0) {
        console.warn(
          "\nFirst request failed. Check cf_clearance cookie.\n"
        );
      }

      if (data) {
        success++;

        if (!loggedShape) {
          debugResponse(data, slug);
          loggedShape = true;
        }

        const plans = extractPaymentPlans(data);

        if (plans) {
          paymentPlansMap[slug] = {
            payment_plans: plans,
          };
        }
      }
    } catch (err) {
      console.log("Failed", slug, err.message);
    }

    done++;

    if (done % 50 === 0) {
      console.log(`Progress ${done}/${toProcess.length}`);
    }

    await sleep(DELAY);
  }

  fs.writeFileSync(outPath, JSON.stringify(paymentPlansMap, null, 2));

  console.log(
    `\nSaved ${Object.keys(paymentPlansMap).length} payment plans`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});