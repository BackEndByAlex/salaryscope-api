export const SALARY_RECORD_INCLUDE = {
  job: { include: { category: true } },
  employeeCountry: true,
  companyCountry: true,
  company: true,
  city: { include: { country: true } },
}
