/**
 * Syncs all salary records from Postgres into Elasticsearch.
 * Run once after seeding: node scripts/syncElasticsearch.js
 * Re-run any time to rebuild the index from scratch.
 */

import "dotenv/config"
import prisma from "../src/config/prismaClient.js"
import { SearchRepository, INDEX } from "../src/repositories/SearchRepository.js"
import esClient from "../src/config/elasticsearchClient.js"
const searchRepo = new SearchRepository()
const BATCH_SIZE = 500

async function main() {
  console.log("Connecting to Elasticsearch…")
  await esClient.ping()
  console.log("Elasticsearch is up.")

  // Drop and recreate the index for a clean sync
  const exists = await esClient.indices.exists({ index: INDEX })
  if (exists) {
    await esClient.indices.delete({ index: INDEX })
    console.log(`Deleted existing index: ${INDEX}`)
  }

  await searchRepo.ensureIndex()

  const total = await prisma.salaryRecord.count()
  console.log(`Syncing ${total} salary records in batches of ${BATCH_SIZE}…`)

  let offset = 0
  let synced = 0

  while (offset < total) {
    const records = await prisma.salaryRecord.findMany({
      skip: offset,
      take: BATCH_SIZE,
      include: {
        job: { include: { category: true } },
        employeeCountry: true,
        city: true,
        company: true,
      },
    })

    await searchRepo.bulkIndex(records)
    synced += records.length
    offset += BATCH_SIZE
    process.stdout.write(`\r${synced}/${total}`)
  }

  console.log(`\nDone. ${synced} records indexed into Elasticsearch.`)
}

main()
  .catch((err) => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
