import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { parse } from "csv-parse/sync"
import prisma from "../src/config/prismaClient.js"

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, "..", "data")
const BATCH_SIZE = 500

// --- File reading ---

function readCsvFile(filename) {
  const filePath = join(DATA_DIR, filename)
  try {
    return readFileSync(filePath, "utf8")
  } catch {
    throw new Error(`Could not read data file: ${filePath}`)
  }
}

// --- Parsing ---

function parseCsv(rawContent) {
  return parse(rawContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })
}

// --- Mapping ---

function mapRowToSalaryRecord(row) {
  const salary = parseFloat(row.salary)
  const salaryInUsd = parseFloat(row.salary_in_usd)

  if (isNaN(salary)) throw new Error(`Invalid salary in row: ${JSON.stringify(row)}`)
  if (isNaN(salaryInUsd)) throw new Error(`Invalid salaryInUsd in row: ${JSON.stringify(row)}`)

  return {
    workYear: parseInt(row.work_year, 10),
    jobTitle: row.job_title,
    jobCategory: row.job_category,
    salaryCurrency: row.salary_currency,
    salary,
    salaryInUsd,
    employeeResidence: row.employee_residence,
    experienceLevel: row.experience_level,
    employmentType: row.employment_type,
    workSetting: row.work_setting,
    companyLocation: row.company_location,
    companySize: row.company_size,
  }
}

function mapRowsToSalaryRecords(rows) {
  return rows.map(mapRowToSalaryRecord)
}

// --- Batching ---

function splitIntoBatches(records, batchSize) {
  const batches = []
  for (let offset = 0; offset < records.length; offset += batchSize) {
    batches.push(records.slice(offset, offset + batchSize))
  }
  return batches
}

// --- Insertion ---

async function insertBatch(batch, batchIndex, totalBatches) {
  const result = await prisma.salaryRecord.createMany({
    data: batch,
    skipDuplicates: true,
  })
  console.log(
    `Batch ${batchIndex + 1}/${totalBatches}: inserted ${result.count} records.`,
  )
  return result.count
}

async function insertAllBatches(records) {
  const batches = splitIntoBatches(records, BATCH_SIZE)
  console.log(
    `Inserting ${records.length} records in ${batches.length} batches of ${BATCH_SIZE}...`,
  )

  let totalInserted = 0
  for (let i = 0; i < batches.length; i++) {
    totalInserted += await insertBatch(batches[i], i, batches.length)
  }
  return totalInserted
}

// --- Orchestration ---

function loadAndParseFile(filename) {
  console.log(`Reading ${filename}...`)
  const raw = readCsvFile(filename)
  const rows = parseCsv(raw)
  return mapRowsToSalaryRecords(rows)
}

async function main() {
  const recordsFromFile1 = loadAndParseFile("jobs_in_data.csv")
  const recordsFromFile2 = loadAndParseFile("jobs_in_data_2024.csv")

  const allRecords = [...recordsFromFile1, ...recordsFromFile2]
  console.log(`Loaded ${allRecords.length} total records across both files.`)

  const totalInserted = await insertAllBatches(allRecords)
  console.log(`Seeding complete. Total rows inserted: ${totalInserted}.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
