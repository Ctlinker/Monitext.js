import { JSDOM } from "jsdom";
import { readFileSync, writeFileSync } from "node:fs";
import { Script } from "../lib/command";
import { resolve } from "node:path";

Script
  .command("table-to-json")
  .description("Convert an HTML table to a JSON array")
  .requiredOption("-i, --input <file>", "input HTML file")
  .requiredOption("-o, --output <file>", "output JSON file path")
  .action((options: { input: string; output: string }) => {
    const inPath = resolve(options.input);
    const outPath = resolve(options.output);

    // Read the HTML file
    const document = new JSDOM(readFileSync(inPath, "utf8")).window.document;

    // Get the first table element
    const table = document.querySelector("table");
    if (!table) {
      console.error("❌ Table not found in the HTML file.");
      process.exit(1);
    }

    // Convert table to array
    const data: string[][] = [];
    const rows = table.querySelectorAll("tr");

    rows.forEach(row => {
      const rowData: string[] = [];
      const cells = row.querySelectorAll("th, td");
      cells.forEach(cell => rowData.push(cell.textContent?.trim() || ""));
      data.push(rowData);
    });

    // Write JSON output
    writeFileSync(outPath, JSON.stringify(data, null, 2));
    console.log(`✅ Table converted to JSON and saved to: ${outPath}`);
  });
