# Scripts

One-time utility scripts that help set up the project. These are not part of the running API, you run them manually when needed.

---

## generate-keys.js

Generates the RSA key pair used to sign and verify JWTs (login tokens).

Here's what it does:

1. Creates a `keys/` folder at the project root if it doesn't exist
2. Generates a pair of RSA keys (2048-bit)
3. Writes them as two files:
   - `keys/private.pem` — used to sign tokens when a user logs in. Keep this secret and never commit it.
   - `keys/public.pem` — used to verify tokens on incoming requests. Safe to share.

> Run this once before starting the API for the first time. If the keys folder already exists, running it again will overwrite the existing keys.

```bash
node scripts/generate-keys.js
```

---

## convert-h1b-xlsx.js

Converts the H-1B LCA disclosure data from the US Department of Labor (a large xlsx file) into a filtered CSV that the seed script can import.

Here's what it does:

1. Streams through the xlsx file row by row (the file is ~83 MB with 600k+ rows, so it uses ExcelJS streaming to avoid running out of memory)
2. Filters for rows that match all three conditions:
   - `CASE_STATUS` is "Certified"
   - `SOC_CODE` starts with "15-" (computer and IT occupations)
   - `WAGE_UNIT_OF_PAY` is "Year" (annual salaries only, for consistency)
3. Title-cases city names (the original data is all uppercase)
4. Writes a clean CSV with these columns: `soc_code`, `soc_title`, `job_title`, `employer_name`, `city`, `state`, `salary`, `salary_max`, `full_time`, `worker_positions`, `wage_level`

The output file (`data/h1b_tech_2024.csv`) typically contains around 68,000 records.

> Run this once after downloading the xlsx file from the DOL website. The seed script expects the output CSV to already exist.

```bash
node scripts/convert-h1b-xlsx.js
```

You can also pass custom input and output paths:

```bash
node scripts/convert-h1b-xlsx.js data/some-other-file.xlsx data/output.csv
```
