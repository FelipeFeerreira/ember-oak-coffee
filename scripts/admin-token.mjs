import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { parse } from "dotenv";

if (JSON.parse(readFileSync("package.json", "utf8")).name !== "ember-oak-coffee") {
  throw new Error("Run this command from the Ember & Oak project root.");
}
const path = ".env.local";
const content = readFileSync(path, "utf8");
const existing = parse(content).ADMIN_TOKEN;
if (existing) {
  console.log("ADMIN_TOKEN already exists in .env.local. It was left unchanged.");
} else {
  const withoutBlank = content.replace(/^ADMIN_TOKEN=.*(?:\r?\n|$)/gm, "");
  writeFileSync(path, `${withoutBlank.trimEnd()}\n\n# Private local owner access. Never commit this file.\nADMIN_TOKEN="${randomBytes(32).toString("hex")}"\n`);
  console.log("Created a private owner token in .env.local. Open that file locally to use it. Restart the app after configuration changes.");
}
