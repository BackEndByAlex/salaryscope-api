// shared so every repository that queries salary records includes identical relations — avoids silent drift between call sites
export const SALARY_RECORD_INCLUDE = {
  job: { include: { category: true } },
  employeeCountry: true,
  companyCountry: true,
  company: true
}
