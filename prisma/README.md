# Prisma

Everything related to the database structure, migrations, and data seeding.

---

## Files

| File / Folder       | Purpose                                                                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `schema.prisma`     | Blueprint of the database — models, relations, indexes. Change this to change the DB structure.                                           |
| `migrations/`       | Auto-generated SQL files. Prisma applies these to build or update the DB. **Never delete.**                                               |
| `seed.js`           | Reads all four CSV files from `data/` and inserts ~68,000 rows across Country, Job, Company, and SalaryRecord tables.                     |
| `prisma.config.mjs` | Lives at project root. Owns the database URL, migrations path, and seed command. Prisma 7 reads this instead of `.env` or `package.json`. |

---

## First-time setup (fresh machine or wiped database)

```bash
# 1. Start the database container
npm run docker:up

# 2. Create the migration and apply it to the database
npm run db:migrate
# When prompted for a name, type something like: init

# 3. Seed all four CSV files (~68k rows)
npm run db:seed
```

---

## Wiping and starting over

Use this when the local database is out of sync with the migration history,
or when you want a clean slate after schema changes.

```bash
# Drops all tables, re-applies all migrations from scratch, then prompts to seed
npm run db:reset
```

> `db:reset` is destructive — all data is lost. It does NOT seed automatically in Prisma 7.
> Run `npm run db:seed` manually afterwards.

---

## Day-to-day commands

```bash
# After editing schema.prisma — creates a new migration and applies it
npm run db:migrate

# After running db:migrate — regenerates the Prisma client (usually auto-runs with migrate)
npm run generate

# Fill the database with CSV data (safe to re-run — uses skipDuplicates)
npm run db:seed

# Open Prisma Studio (browser UI to browse and edit rows)
npm run db:studio
```

---

## Schema changes workflow

1. Edit `schema.prisma`
2. Run `npm run db:migrate` — name the migration after what you changed (e.g. `add_salary_index`)
3. Prisma generates the SQL file in `migrations/` and applies it
4. The Prisma client is regenerated automatically

---

## Production / Docker

```bash
# Applies pending migrations without prompting — safe for CI and Docker startup
npx prisma migrate deploy
```

The `docker-compose.yml` api service runs this automatically on every startup:

```
command: sh -c "npx prisma migrate deploy && node src/server.js"
```

---

## Dataset files

The `data/` folder is **not committed to git**. Download the CSV files and place them there before seeding.

| File                                     | Source                                                                                                                        | Rows    |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------- |
| `jobs_in_data.csv`                       | [Jobs in Data 2020–2023 — Kaggle](https://www.kaggle.com/datasets/hummaamqaasim/jobs-in-data)                                 | ~9,355  |
| `jobs_in_data_2024.csv`                  | [Jobs and Salaries in Data 2024 — Kaggle](https://www.kaggle.com/datasets/murilozangari/jobs-and-salaries-in-data-field-2024) | ~14,199 |
| `Salary_Dataset_with_Extra_Features.csv` | Kaggle — company salaries with ratings                                                                                        | ~22,770 |
| `Software_Professional_Salaries.csv`     | Kaggle — software company salaries                                                                                            | ~22,774 |

---

## Database schema overview

```
Country ──────────────────────────────────────────┐
  id, name                                         │
                                                   │
Job ──────────────────────────────────┐            │
  id, title, category?, roles?        │            │
                                      ↓            ↓
Company ──────────────────→  SalaryRecord  ←──── Country
  id, name, rating?,            (fact table)     (company location)
  countryId?                  jobId (FK)
                              companyId? (FK)
                              employeeCountryId? (FK)
                              companyCountryId? (FK)
                              salary, source, ...

User
  id, email, passwordHash  (auth only — no relation to SalaryRecord)
```

`source` on `SalaryRecord` tells you which CSV the row came from:

- `"jobs_in_data"` — global tech salaries (CSV A)
- `"salary_extra"` — company salaries with ratings (CSV B)
- `"software_pro"` — software professional salaries (CSV C)
