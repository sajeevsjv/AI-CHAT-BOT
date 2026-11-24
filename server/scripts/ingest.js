// Copies the text of reveforge.com into MongoDB for the chatbot. Run with: pnpm ingest
// Safe to re-run whenever the website changes: only new or edited sections are embedded.
import "dotenv/config";
import { createHash } from "node:crypto";
import * as cheerio from "cheerio";
import mongoose from "mongoose";
import connectDB from "../db/mongoConnect.js";
import KnowledgeChunk from "../db/models/knowledgeChunk.js";
import { embedDocuments, EMBEDDING_DIMENSIONS } from "../services/embeddingService.js";
import { VECTOR_INDEX } from "../services/ragService.js";

const SITE = "https://reveforge.com";
const MAX_CHUNK_CHARS = 1500;
const EMBED_BATCH = 20;

const clean = (s) => s.replace(/\s+/g, " ").trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const fetchText = async (url) => {
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.text();
};

const getPageUrls = async () => {
  const $ = cheerio.load(await fetchText(`${SITE}/sitemap.xml`), { xml: true });
  const urls = $("loc").map((_, el) => clean($(el).text())).get();
  return urls.filter((u) => new URL(u).origin === SITE);
};

const BLOCK =
  "h1,h2,h3,h4,p,li,dt,dl,ul,ol,div,section,article,details,summary,header,footer,table,tr,figure,blockquote";

// Turns a page into a list of { heading, lines } sections, split on every h1/h2
const readSections = ($) => {
  const main = $("main");
  main.find("script, style, noscript, svg, nav, aside, form, video, button").remove();
  main
    .find("span")
    .filter((_, el) => /^\((opens in a )?new tab\)$/i.test(clean($(el).text())))
    .remove();
  main.find("br").replaceWith(" ");

  const sections = [{ heading: "Introduction", lines: [] }];
  const add = (text) => {
    const line = clean(text);
    if (line) sections.at(-1).lines.push(line);
  };

  const addHeading = (el) => {
    if (el.is("h1, h2")) sections.push({ heading: clean(el.text()), lines: [] });
    else add(`## ${clean(el.text()).replace(/^\d+(?=Module)/, "")}`); // drop the number badge
  };

  const walk = (node) => {
    // Cards show a label and hours above their heading. Emit the heading first, otherwise
    // "235+ Hours" would be stored under the previous program.
    const headings = $(node).find("h1, h2, h3, h4");
    if (headings.length === 1) {
      addHeading(headings);
      headings.remove();
    }

    let inline = "";
    const flush = () => {
      add(inline);
      inline = "";
    };

    $(node).contents().each((_, child) => {
      if (child.type === "text") {
        inline += child.data;
        return;
      }
      if (child.type !== "tag") return;
      const el = $(child);

      if (el.is("h1, h2, h3, h4")) {
        flush();
        addHeading(el);
      } else if (el.is("details")) {
        flush();
        const summary = el.children("summary");
        const question = clean(summary.text());
        summary.remove();
        add(`Q: ${question} A: ${el.text()}`);
      } else if (el.is("dt")) {
        flush();
        add(`${clean(el.text())}: ${el.next("dd").text()}`);
      } else if (el.is("dd")) {
        // already added together with its dt
      } else if (el.is("li") && el.find(BLOCK).length === 0) {
        flush();
        add(`- ${el.text()}`);
      } else if (el.is(BLOCK) || el.find(BLOCK).length > 0) {
        flush();
        walk(child);
        flush();
      } else {
        inline += ` ${el.text()} `;
      }
    });
    flush();
  };

  walk(main[0]);
  return sections.filter((s) => s.lines.length > 0);
};

// Keeps each chunk under the limit, repeating the current sub-heading when a section is split
const splitLines = (lines) => {
  const parts = [];
  let current = [];
  let subHeading = "";
  for (const line of lines) {
    if (line.startsWith("## ")) subHeading = line;
    const size = current.reduce((n, l) => n + l.length + 1, 0);
    if (current.length > 0 && size + line.length > MAX_CHUNK_CHARS) {
      parts.push(current);
      current = subHeading && subHeading !== line ? [subHeading] : [];
    }
    current.push(line);
  }
  if (current.length > 0) parts.push(current);
  return parts.map((p) => p.join("\n"));
};

// Social links and similar facts exist only in the home page's structured data
const organizationChunk = ($, url) => {
  for (const el of $('script[type="application/ld+json"]').get()) {
    const org = JSON.parse($(el).text());
    if (![org["@type"]].flat().includes("EducationalOrganization")) continue;
    const phones = (org.contactPoint ?? []).map((c) => c.telephone).join(", ");
    const { address } = org;
    return {
      url,
      title: "Reveforge",
      heading: "Organization details and social media links",
      text: [
        org.description,
        org.slogan && `Slogan: ${org.slogan}`,
        org.founder?.name && `Founder: ${org.founder.name}, ${org.founder.jobTitle}`,
        phones && `Admissions phone: ${phones}`,
        org.email && `Email: ${org.email}`,
        address && `Address: ${address.streetAddress}, ${address.addressLocality}, ${address.addressRegion}`,
        org.hasMap && `Map: ${org.hasMap}`,
        org.sameAs && `Social media: ${org.sameAs.join(", ")}`,
      ]
        .filter(Boolean)
        .join("\n"),
    };
  }
  return null;
};

const readPage = async (url) => {
  const $ = cheerio.load(await fetchText(url));
  const title = clean($("title").text()).replace(/\s*\|\s*Reveforge$/, "");
  const org = new URL(url).pathname === "/" ? organizationChunk($, url) : null;

  const chunks = readSections($).flatMap(({ heading, lines }) =>
    splitLines(lines).map((text) => ({ url, title, heading, text }))
  );
  if (chunks.length === 0) throw new Error(`No text found on ${url}`);
  return org ? [...chunks, org] : chunks;
};

const embedWithRetry = async (batch) => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await embedDocuments(batch);
    } catch (err) {
      if (err?.status !== 429 || attempt >= 4) throw err;
      console.log("Rate limited by Gemini, waiting 60s...");
      await sleep(60000);
    }
  }
};

const ensureVectorIndex = async () => {
  const { collection } = KnowledgeChunk;
  const find = async () => (await collection.listSearchIndexes(VECTOR_INDEX).toArray())[0];

  if (!(await find())) {
    console.log("Creating vector search index...");
    await collection.createSearchIndex({
      name: VECTOR_INDEX,
      type: "vectorSearch",
      definition: {
        fields: [
          { type: "vector", path: "embedding", numDimensions: EMBEDDING_DIMENSIONS, similarity: "cosine" },
        ],
      },
    });
  }

  for (let i = 0; i < 60; i++) {
    const index = await find();
    if (index?.queryable) return;
    if (index?.status === "FAILED") throw new Error("Vector index build failed");
    await sleep(3000);
  }
  throw new Error("Vector index was not ready after 3 minutes. Check it in the Atlas UI.");
};

const main = async () => {
  // Any page that fails stops the run here, before stored data is touched
  const chunks = [];
  for (const url of await getPageUrls()) {
    const pageChunks = await readPage(url);
    console.log(`${String(pageChunks.length).padStart(3)} sections  ${url}`);
    chunks.push(...pageChunks);
  }
  if (chunks.length === 0) throw new Error("The sitemap listed no pages");

  for (const c of chunks) {
    c.hash = createHash("sha256").update([c.url, c.title, c.heading, c.text].join("\n")).digest("hex");
  }
  const unique = [...new Map(chunks.map((c) => [c.hash, c])).values()];

  if (process.argv.includes("--dry-run")) {
    for (const c of unique) console.log(`\n=== ${c.url}\n[${c.title} - ${c.heading}]\n${c.text}`);
    console.log(`\n${unique.length} sections (dry run, nothing saved)`);
    return;
  }

  await connectDB();
  await KnowledgeChunk.createCollection();

  const stored = new Set(await KnowledgeChunk.distinct("hash"));
  const fresh = unique.filter((c) => !stored.has(c.hash));
  for (let i = 0; i < fresh.length; i += EMBED_BATCH) {
    const batch = fresh.slice(i, i + EMBED_BATCH);
    const vectors = await embedWithRetry(batch);
    await KnowledgeChunk.insertMany(batch.map((c, j) => ({ ...c, embedding: vectors[j] })));
    console.log(`Embedded ${i + batch.length}/${fresh.length}`);
  }

  const { deletedCount } = await KnowledgeChunk.deleteMany({ hash: { $nin: unique.map((c) => c.hash) } });
  await ensureVectorIndex();
  console.log(`Done: ${fresh.length} added, ${deletedCount} outdated removed, ${unique.length} total`);
};

try {
  await main();
} catch (err) {
  console.error("Ingest failed:", err);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
