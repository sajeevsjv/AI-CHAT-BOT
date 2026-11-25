// Copies the text of reveforge.com into MongoDB for the chatbot. Run with: pnpm ingest
// Safe to re-run whenever the website changes: only new or edited sections are embedded.
import "dotenv/config";
import * as cheerio from "cheerio";
import mongoose from "mongoose";
import { readCourseDocs } from "./courseDocs.js";
import { saveChunks, splitLines } from "./saveChunks.js";

const SITE = "https://reveforge.com";

const clean = (s) => s.replace(/\s+/g, " ").trim();

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

// Removes the website's version of every program that has a course document, so the bot only
// sees the document's details. Fees, batch and job guarantee answers are kept.
const removeReplacedDetails = (docs, sections) => {
  const pageDoc = docs.find((d) => sections.some((s) => s.heading === `${d.program} at a glance`));
  if (pageDoc) {
    pageDoc.pageFound = true;
    sections = sections.filter(
      (s) => !/( at a glance|curriculum: \d+ modules|^Capstone brief)$/i.test(s.heading)
    );
  }

  return sections.map(({ heading, lines }) => {
    let current = heading;
    const kept = lines.flatMap((line) => {
      if (line.startsWith("## ")) current = line.slice(3);

      const isOldAnswer = docs.some(
        (d) =>
          line.startsWith(`Q: How long is ${d.program}?`) ||
          (line.startsWith("Q: How are AI") && line.includes(` covered in ${d.program}?`))
      );
      if (isOldAnswer) return [];

      // Row in the table of all programs: name, subject, hours, modules, capstone
      const row = docs.find((d) => line.startsWith(d.program) && /\d+\+ Hours \d+ /.test(line));
      if (row) {
        return [line.replace(/\d+\+ Hours \d+ .*$/, () => `${row.duration} ${row.modules} ${row.capstone}`)];
      }

      // Program card: drop its hours and technology list
      if (docs.some((d) => current === d.program || current.endsWith(`: ${d.program}`))) {
        if (line.startsWith("- ")) return [];
        return [line.replace(/\s*\d+\+ Hours$/, "")].filter(Boolean);
      }
      return [line];
    });
    return { heading, lines: kept };
  });
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

const readPage = async (url, docs) => {
  const $ = cheerio.load(await fetchText(url));
  const title = clean($("title").text()).replace(/\s*\|\s*Reveforge$/, "");
  const org = new URL(url).pathname === "/" ? organizationChunk($, url) : null;

  const chunks = removeReplacedDetails(docs, readSections($)).flatMap(({ heading, lines }) =>
    splitLines(lines).map((text) => ({ url, title, heading, text }))
  );
  if (chunks.length === 0) throw new Error(`No text found on ${url}`);
  return org ? [...chunks, org] : chunks;
};

const main = async () => {
  const docs = await readCourseDocs();

  // Any page that fails stops the run here, before stored data is touched
  const chunks = [];
  for (const url of await getPageUrls()) {
    const pageChunks = await readPage(url, docs);
    console.log(`${String(pageChunks.length).padStart(3)} sections  ${url}`);
    chunks.push(...pageChunks);
  }
  if (chunks.length === 0) throw new Error("The sitemap listed no pages");

  for (const d of docs) {
    if (!d.pageFound) throw new Error(`${d.file}: no page on the website for program "${d.program}"`);
    console.log(`${d.program}: website details replaced by ${d.file}`);
  }

  await saveChunks(chunks, "website");
};

try {
  await main();
} catch (err) {
  console.error("Ingest failed:", err);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
