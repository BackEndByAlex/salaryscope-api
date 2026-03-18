/**
 * Converts H-1B LCA disclosure data from xlsx to a filtered CSV.
 *
 * Filters:
 *  - CASE_STATUS = "Certified"
 *  - SOC_CODE starts with "15-" (computer / IT occupations)
 *  - WAGE_UNIT_OF_PAY = "Year" (comparable annual salaries)
 *
 * Usage:
 *   node scripts/convert-h1b-xlsx.js [inputFile] [outputFile]
 *
 * Defaults:
 *   input:  data/LCA_Disclosure_Data_FY2024_Q4.xlsx
 *   output: data/h1b_tech_2024.csv
 */

import { createWriteStream } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import ExcelJS from "exceljs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, "..", "data")

const inputFile = process.argv[2] || join(DATA_DIR, "LCA_Disclosure_Data_FY2024_Q4.xlsx")
const outputFile = process.argv[3] || join(DATA_DIR, "h1b_tech_2024.csv")

const KEEP_COLUMNS = [
  "SOC_CODE",
  "SOC_TITLE",
  "JOB_TITLE",
  "EMPLOYER_NAME",
  "WORKSITE_CITY",
  "WORKSITE_STATE",
  "WAGE_RATE_OF_PAY_FROM",
  "WAGE_RATE_OF_PAY_TO",
  "FULL_TIME_POSITION",
  "TOTAL_WORKER_POSITIONS",
  "PW_WAGE_LEVEL",
]

const CSV_HEADERS = [
  "soc_code",
  "soc_title",
  "job_title",
  "employer_name",
  "city",
  "state",
  "salary",
  "salary_max",
  "full_time",
  "worker_positions",
  "wage_level",
]

function escapeCsvField(value) {
  const str = String(value ?? "")
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function titleCase(str) {
  if (!str) return str
  return str
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

async function convert() {
  const workbook = new ExcelJS.stream.xlsx.WorkbookReader(inputFile, {
    entries: "emit",
    sharedStrings: "cache",
  })

  const output = createWriteStream(outputFile, "utf8")
  output.write(CSV_HEADERS.join(",") + "\n")

  let headers = null
  let rowCount = 0
  let written = 0
  let skipped = 0

  workbook.on("worksheet", (worksheet) => {
    worksheet.on("row", (row) => {
      rowCount++

      if (rowCount === 1) {
        headers = row.values.slice(1)
        return
      }

      const vals = row.values.slice(1)
      const get = (name) => vals[headers.indexOf(name)]

      const socCode = String(get("SOC_CODE") || "")
      const status = String(get("CASE_STATUS") || "")
      const unit = String(get("WAGE_UNIT_OF_PAY") || "")

      if (!socCode.startsWith("15-") || status !== "Certified" || unit !== "Year") {
        skipped++
        return
      }

      const salary = Number(get("WAGE_RATE_OF_PAY_FROM"))
      if (!salary || salary <= 0) {
        skipped++
        return
      }

      const values = KEEP_COLUMNS.map((col) => {
        let val = get(col)
        if (col === "WORKSITE_CITY") val = titleCase(String(val || ""))
        if (col === "WAGE_RATE_OF_PAY_FROM" || col === "WAGE_RATE_OF_PAY_TO") {
          val = Number(val) || ""
        }
        return escapeCsvField(val)
      })

      output.write(values.join(",") + "\n")
      written++

      if (written % 10000 === 0) {
        console.log(`  ${written} records written...`)
      }
    })
  })

  workbook.on("end", () => {
    output.end()
    console.log(`\nDone!`)
    console.log(`  Total rows scanned: ${rowCount - 1}`)
    console.log(`  Tech records written: ${written}`)
    console.log(`  Skipped: ${skipped}`)
    console.log(`  Output: ${outputFile}`)
  })

  workbook.read()
}

convert().catch((err) => {
  console.error("Conversion failed:", err)
  process.exitCode = 1
})
