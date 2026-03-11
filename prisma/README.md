# Prisma

This folder owns everything related to the database — its structure, its history of changes, and the script that fills it with data.

---

## schema.prisma

This is the blueprint of the database. It defines every table, every column, and how the tables are connected to each other.

The tables in this project are:

- **Country** — stores unique country names. Used to track where employees live and where companies are located.
- **JobCategory** — groups jobs into categories like "Data Science" or "Machine Learning".
- **Job** — stores job titles. Each job can belong to a category.
- **Company** — stores company names, ratings, and their country.
- **SalaryRecord** — the main table. Every salary entry links to a job, and optionally to a company and two countries (where the employee lives, where the company is). Salary records also track things like work year, experience level, employment type, and work setting.
- **User** — stores registered users. Used only for authentication — users can create and manage their own salary records.

When you change `schema.prisma`, you always create a migration afterwards to apply those changes to the database.

---

## migrations/

Every time the schema is changed, Prisma generates a SQL file here that describes exactly what needs to change in the database.

When deploying to production, Prisma reads these files and applies any that haven't run yet — this is how the database stays in sync across environments without wiping it.

> Never delete or edit these files manually.

---

## seed.js

This script fills the database with real-world salary data from four CSV files (~68,000 rows total).

Here's what it does, step by step:

1. Reads all four CSV files from the `data/` folder
2. Collects all unique countries, categories, jobs, and companies — and inserts them first (these are the lookup tables that salary records reference)
3. Maps each CSV row to a salary record and links it to the right job, company, and countries using the IDs from step 2
4. Inserts all salary records in batches of 500 to avoid overloading the database

The script uses `skipDuplicates` — so it's safe to run more than once. Rows that already exist are skipped, not duplicated.

> The `data/` folder is not committed to git. You need to download the CSV files and place them there before seeding. Links to the datasets are in the root README.

---

## Commands

```bash
# Apply all pending migrations (use this on a fresh database or after pulling new migrations)
npm run db:migrate

# Fill the database with CSV data
npm run db:seed

# Wipe the database and start over (destructive — all data is lost)
npm run db:reset

# Open a browser UI to browse and edit rows
npm run db:studio
```
