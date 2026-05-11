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
// For simplicity, we treat employee residence and company location as the same "country" dimension.
async function seedCountries(aRows, bRows, cRows, dRows, eRows) {
  const names = new Set()

  for (const row of aRows) {
    if (row.employee_residence) names.add(row.employee_residence)
    if (row.company_location) names.add(row.company_location)
  }
  for (const row of [...bRows, ...cRows]) {
    if (row.Location) names.add(row.Location)
  }
  if (dRows.length > 0) names.add("United States")
  if (eRows.length > 0) names.add("Germany")

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
async function seedCities(dRows, eRows, countryMap) {
  const citySet = new Map()
  const usCountryId = countryMap.get("United States")
  const deCountryId = countryMap.get("Germany")

  for (const row of dRows) {
    const name = row.city?.trim()
    const state = row.state?.trim() || null
    if (!name) continue
    const key = `${name}|${state}|US`
    if (!citySet.has(key))
      citySet.set(key, { name, state, countryId: usCountryId })
  }

  for (const row of eRows) {
    const name = row.City?.trim()
    if (!name) continue
    const key = `${name}|null|EU`
    if (!citySet.has(key))
      citySet.set(key, { name, state: null, countryId: deCountryId })
  }

  console.log(`Upserting ${citySet.size} cities...`)

  const entries = await runInChunks(
    [...citySet.entries()],
    async ([key, { name, state, countryId }]) => {
      const existing = await prisma.city.findFirst({
        where: { name, state, countryId },
      })
      const city =
        existing ??
        (await prisma.city.create({ data: { name, state, countryId } }))
      return [key, city.id]
    },
  )

  return new Map(entries)
}

async function seedJobs(aRows, bRows, cRows, dRows, eRows, categoryMap) {
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

  for (const row of dRows) {
    const title = row.soc_title?.trim()
    if (!title) continue
    const key = `${title}|null`
    if (!jobMap.has(key))
      jobMap.set(key, { title, categoryId: null, roles: null })
  }

  for (const row of eRows) {
    const title = row["Position "]?.trim() || row.Position?.trim()
    if (!title) continue
    const key = `${title}|null`
    if (!jobMap.has(key))
      jobMap.set(key, { title, categoryId: null, roles: null })
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

async function seedCompanies(bRows, cRows, dRows, countryMap) {
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

  const usCountryId = countryMap.get("United States") ?? null
  for (const row of dRows) {
    const name = row.employer_name?.trim()
    if (!name || companyByName.has(name)) continue
    companyByName.set(name, { rating: null, countryId: usCountryId })
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

function mapH1bRecord(row, countryMap, jobMap, companyMap, cityMap) {
  const salary = row.salary?.trim()
  if (!salary || isNaN(Number(salary))) return null

  const title = row.soc_title?.trim()
  const jobId = jobMap.get(`${title}|null`)
  if (!jobId) return null

  const employerName = row.employer_name?.trim()
  const cityKey = `${row.city?.trim()}|${row.state?.trim() || null}|US`
  const usCountryId = countryMap.get("United States") ?? null

  return {
    salary,
    salaryInUsd: salary,
    salaryCurrency: "USD",
    employmentType: row.full_time === "Y" ? "FT" : "PT",
    source: "h1b_visa",
    jobId,
    employeeCountryId: usCountryId,
    companyCountryId: usCountryId,
    companyId: companyMap.get(employerName) ?? null,
    cityId: cityMap.get(cityKey) ?? null,
  }
}

function mapEuSurveyRecord(row, countryMap, jobMap, cityMap) {
  const salaryStr =
    row["Yearly brutto salary (without bonus and stocks) in EUR"]?.trim()
  if (!salaryStr || isNaN(Number(salaryStr))) return null

  const title = row["Position "]?.trim() || row.Position?.trim()
  const jobId = jobMap.get(`${title}|null`)
  if (!jobId) return null

  const cityName = row.City?.trim()
  const cityKey = `${cityName}|null|EU`
  const deCountryId = countryMap.get("Germany") ?? null

  const seniority = row["Seniority level"]?.trim()
  const experienceLevel =
    seniority === "Senior"
      ? "SE"
      : seniority === "Middle" || seniority === "Mid"
        ? "MI"
        : seniority === "Junior"
          ? "EN"
          : seniority === "Lead" ||
              seniority === "Principal" ||
              seniority === "Staff"
            ? "EX"
            : null

  const empStatus = row["Employment status"]?.trim()
  const employmentType =
    empStatus === "Full-time employee"
      ? "FT"
      : empStatus === "Part-time employee"
        ? "PT"
        : empStatus === "Freelancer"
          ? "FL"
          : empStatus === "Contractor"
            ? "CT"
            : null

  const companySize = row["Company size"]?.trim()

  return {
    salary: salaryStr,
    salaryCurrency: "EUR",
    workYear: 2020,
    experienceLevel,
    employmentType,
    companySize: companySize || null,
    source: "eu_survey_2020",
    jobId,
    employeeCountryId: deCountryId,
    companyCountryId: null,
    companyId: null,
    cityId: cityMap.get(cityKey) ?? null,
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
  const dRows = []
  const eRows = loadAndParseCsv("2020.csv")
  console.log(
    `Loaded: ${aRows.length} (A) + ${bRows.length} (B) + ${cRows.length} (C) + ${eRows.length} (E/EU-2020) rows.`,
  )

  const countryMap = await seedCountries(aRows, bRows, cRows, dRows, eRows)
  const categoryMap = await seedCategories(aRows)
  const jobMap = await seedJobs(aRows, bRows, cRows, dRows, eRows, categoryMap)
  const companyMap = await seedCompanies(bRows, cRows, dRows, countryMap)
  const cityMap = await seedCities(dRows, eRows, countryMap)

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

  const eRecords = eRows.map((row) => {
    const record = mapEuSurveyRecord(row, countryMap, jobMap, cityMap)
    if (!record)
      console.warn(`Skipping invalid EU-2020 row: ${JSON.stringify(row)}`)
    return record
  })

  const totalInserted = await insertAllBatches([
    ...aRecords,
    ...bRecords,
    ...cRecords,
    ...eRecords,
  ])
  console.log(`Seeding complete. Total rows inserted: ${totalInserted}.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
