import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { parse } from "csv-parse/sync"
import prisma from "../src/config/prismaClient.js"

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, "..", "data")
const BATCH_SIZE = 500

// --- CSV loading ---

function loadAndParseCsv(filename) {
  const filePath = join(DATA_DIR, filename)
  const raw = readFileSync(filePath, "utf8")
  return parse(raw, { columns: true, skip_empty_lines: true, trim: true })
}

// --- Concurrency helper ---

// Runs an async function over items in sequential batches to avoid overwhelming the DB with too many concurrent requests.
async function runInChunks(items, fn, chunkSize = 50) {
  const results = []
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize)
    const batch = await Promise.all(chunk.map(fn))
    results.push(...batch)
  }
  return results
}

// --- Dimension seeding ---

// Upsert countries and return a map of name → id for foreign key references.
async function seedCountries(aRows, bRows, cRows) {
  const names = new Set()

  for (const row of aRows) {
    if (row.employee_residence) names.add(row.employee_residence)
    if (row.company_location) names.add(row.company_location)
  }
  for (const row of [...bRows, ...cRows]) {
    if (row.Location) names.add(row.Location)
  }

  console.log(`Upserting ${names.size} countries...`)

  const entries = await runInChunks([...names], (name) =>
    prisma.country.upsert({ where: { name }, update: {}, create: { name } }),
  )

  return new Map(entries.map((c) => [c.name, c.id]))
}

async function seedCategories(aRows) {
  const names = new Set()
  for (const row of aRows) {
    if (row.job_category) names.add(row.job_category.trim())
  }

  console.log(`Upserting ${names.size} job categories...`)

  const entries = await runInChunks([...names], (name) =>
    prisma.jobCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    }),
  )

  return new Map(entries.map((c) => [c.name, c.id]))
}

// Upsert jobs and return a map of "title|categoryName" → id for foreign key references.
async function seedJobs(aRows, bRows, cRows, categoryMap) {
  const jobMap = new Map()

  for (const row of aRows) {
    const title = row.job_title?.trim()
    const categoryName = row.job_category?.trim() || null
    const categoryId = categoryMap.get(categoryName) ?? null
    if (!title) continue
    const key = `${title}|${categoryName}`
    if (!jobMap.has(key)) jobMap.set(key, { title, categoryId, roles: null })
  }

  for (const row of [...bRows, ...cRows]) {
    const title = row["Job Title"]?.trim()
    const roles = row["Job Roles"]?.trim() || null
    if (!title) continue
    const key = `${title}|null`
    if (!jobMap.has(key)) jobMap.set(key, { title, categoryId: null, roles })
  }

  console.log(`Upserting ${jobMap.size} jobs...`)

  // findFirst + create instead of upsert — Prisma throws on null in compound unique where.
  const entries = await runInChunks(
    [...jobMap.entries()],
    async ([key, { title, categoryId, roles }]) => {
      const existing = await prisma.job.findFirst({
        where: { title, categoryId },
      })
      const job =
        existing ??
        (await prisma.job.create({ data: { title, categoryId, roles } }))
      return [key, job.id]
    },
  )

  return new Map(entries)
}

async function seedCompanies(bRows, cRows, countryMap) {
  const companyByName = new Map()

  for (const row of [...bRows, ...cRows]) {
    const name = row["Company Name"]?.trim()
    if (!name) continue
    const rating = parseFloat(row.Rating)
    const countryId = countryMap.get(row.Location?.trim()) ?? null
    companyByName.set(name, {
      rating: isNaN(rating) ? null : rating,
      countryId,
    })
  }

  console.log(`Upserting ${companyByName.size} companies...`)
  // Similar to jobs, Prisma doesn't allow upsert with null in unique fields — use findFirst + create instead.
  const entries = await runInChunks(
    [...companyByName.entries()],
    ([name, { rating, countryId }]) =>
      prisma.company
        .upsert({
          where: { name },
          update: {},
          create: { name, rating, countryId },
        })
        .then((company) => [name, company.id]),
  )

  return new Map(entries)
}

// --- Row mapping ---

function mapDatasetARecord(row, countryMap, jobMap) {
  // Pass salary strings directly to Prisma Decimal — avoids IEEE 754 float rounding
  // before the value reaches the DB (e.g. parseFloat("123456.78") → 123456.78000000001).
  const salary = row.salary?.trim()
  const salaryInUsd = row.salary_in_usd?.trim()

  if (!salary || isNaN(Number(salary))) return null

  const title = row.job_title?.trim()
  const category = row.job_category?.trim() || null
  const jobId = jobMap.get(`${title}|${category}`)
  if (!jobId) return null

  // For countries, trim whitespace and use the map to convert to foreign keys. If a country isn't found in the map, set the FK to null and log a warning.
  return {
    salary,
    salaryInUsd:
      salaryInUsd && !isNaN(Number(salaryInUsd)) ? salaryInUsd : null,
    salaryCurrency: row.salary_currency || null,
    workYear: parseInt(row.work_year, 10) || null,
    experienceLevel: row.experience_level || null,
    employmentType: row.employment_type || null,
    workSetting: row.work_setting || null,
    companySize: row.company_size || null,
    source: "jobs_in_data",
    jobId,
    employeeCountryId: countryMap.get(row.employee_residence?.trim()) ?? null,
    companyCountryId: countryMap.get(row.company_location?.trim()) ?? null,
    companyId: null,
  }
}

// Datasets B and C have the same structure, so we can use one mapping function for both. 
// The "source" parameter allows us to handle any source-specific fields (e.g. "Employment Status" only exists in Dataset B).
function mapDatasetBCRecord(row, countryMap, jobMap, companyMap, source) {
  const salary = row.Salary?.trim()
  if (!salary || isNaN(Number(salary))) return null

  const title = row["Job Title"]?.trim()
  const jobId = jobMap.get(`${title}|null`)
  if (!jobId) return null

  const salariesReported = parseInt(row["Salaries Reported"], 10)
  const companyName = row["Company Name"]?.trim()

  return {
    salary,
    salariesReported: isNaN(salariesReported) ? null : salariesReported,
    employmentStatus:
      source === "salary_extra" ? row["Employment Status"] || null : null,
    source,
    jobId,
    employeeCountryId: countryMap.get(row.Location?.trim()) ?? null,
    companyCountryId: null,
    companyId: companyMap.get(companyName) ?? null,
  }
}

// --- Batch insertion ---

async function insertAllBatches(records) {
  const validRecords = records.filter(Boolean)
  const totalBatches = Math.ceil(validRecords.length / BATCH_SIZE)

  console.log(
    `Inserting ${validRecords.length} records in ${totalBatches} batches of ${BATCH_SIZE}...`,
  )

  let totalInserted = 0
  for (let i = 0; i < totalBatches; i++) {
    const batch = validRecords.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE)
    const result = await prisma.salaryRecord.createMany({
      data: batch,
      skipDuplicates: true,
    })
    console.log(
      `Batch ${i + 1}/${totalBatches}: inserted ${result.count} records.`,
    )
    totalInserted += result.count
  }

  return totalInserted
}

// --- Orchestration ---

async function main() {
  console.log("Loading CSV files...")
  const aRows = [
    ...loadAndParseCsv("jobs_in_data.csv"),
    ...loadAndParseCsv("jobs_in_data_2024.csv"),
  ]
  const bRows = loadAndParseCsv("Salary_Dataset_with_Extra_Features.csv")
  const cRows = loadAndParseCsv("Software_Professional_Salaries.csv")
  console.log(
    `Loaded: ${aRows.length} (A) + ${bRows.length} (B) + ${cRows.length} (C) rows.`,
  )

  const countryMap = await seedCountries(aRows, bRows, cRows)
  const categoryMap = await seedCategories(aRows)
  const jobMap = await seedJobs(aRows, bRows, cRows, categoryMap)
  const companyMap = await seedCompanies(bRows, cRows, countryMap)

  const aRecords = aRows.map((row) => {
    const record = mapDatasetARecord(row, countryMap, jobMap)
    if (!record)
      console.warn(`Skipping invalid Dataset A row: ${JSON.stringify(row)}`)
    return record
  })

  const bRecords = bRows.map((row) => {
    const record = mapDatasetBCRecord(
      row,
      countryMap,
      jobMap,
      companyMap,
      "salary_extra",
    )
    if (!record)
      console.warn(`Skipping invalid Dataset B row: ${JSON.stringify(row)}`)
    return record
  })

  const cRecords = cRows.map((row) => {
    const record = mapDatasetBCRecord(
      row,
      countryMap,
      jobMap,
      companyMap,
      "software_pro",
    )
    if (!record)
      console.warn(`Skipping invalid Dataset C row: ${JSON.stringify(row)}`)
    return record
  })

  const totalInserted = await insertAllBatches([
    ...aRecords,
    ...bRecords,
    ...cRecords,
  ])
  console.log(`Seeding complete. Total rows inserted: ${totalInserted}.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
