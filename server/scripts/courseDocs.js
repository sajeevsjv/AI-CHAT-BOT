// Reads the course documents in server/data/*.md. Each file looks like this:
//
//   ---
//   program: Forge Build            (exact program name on the website)
//   duration: 6 Months              (duration, modules and capstone replace the website's
//   modules: 14                      values in its table of all programs)
//   capstone: E-Commerce Platform
//   ---
//   # Document title
//   ## Section
//   text...
import { readdir, readFile } from "node:fs/promises";

const DATA_DIR = new URL("../data/", import.meta.url);
const FIELDS = ["program", "duration", "modules", "capstone"];

const parseDoc = (file, text) => {
  const match = text.replaceAll("\r\n", "\n").match(/^﻿?---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`${file} must start with a "---" block containing ${FIELDS.join(", ")}`);

  const doc = { file, sections: [] };
  for (const line of match[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) doc[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  for (const field of FIELDS) {
    if (!doc[field]) throw new Error(`${file} is missing "${field}" in its "---" block`);
  }

  for (const line of match[2].split("\n").map((l) => l.trim()).filter(Boolean)) {
    if (line.startsWith("# ")) {
      doc.title = line.slice(2).trim();
    } else if (line.startsWith("## ")) {
      doc.sections.push({ heading: line.slice(3).trim(), lines: [] });
    } else {
      if (doc.sections.length === 0) throw new Error(`${file} has text before its first "## " section`);
      doc.sections.at(-1).lines.push(line.replace(/^### /, "## "));
    }
  }
  if (!doc.title) throw new Error(`${file} needs a "# " title`);
  if (doc.sections.length === 0) throw new Error(`${file} needs at least one "## " section`);
  return doc;
};

export const readCourseDocs = async () => {
  const files = await readdir(DATA_DIR).catch((err) => {
    if (err.code === "ENOENT") return [];
    throw err;
  });

  const docs = [];
  for (const file of files.filter((f) => f.endsWith(".md"))) {
    const doc = parseDoc(file, await readFile(new URL(encodeURIComponent(file), DATA_DIR), "utf8"));
    const other = docs.find((d) => d.program === doc.program || d.title === doc.title);
    if (other) throw new Error(`${file} and ${other.file} have the same program or title`);
    docs.push(doc);
  }
  return docs;
};
