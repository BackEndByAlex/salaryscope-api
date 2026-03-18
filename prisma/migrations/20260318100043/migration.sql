-- CreateTable
CREATE TABLE "Country" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT,
    "countryId" INTEGER NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "JobCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "categoryId" INTEGER,
    "roles" TEXT,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "rating" DECIMAL(3,1),
    "countryId" INTEGER,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryRecord" (
    "id" SERIAL NOT NULL,
    "salary" DECIMAL(12,2) NOT NULL,
    "source" TEXT NOT NULL,
    "salaryInUsd" DECIMAL(12,2),
    "salaryCurrency" TEXT,
    "workYear" INTEGER,
    "experienceLevel" TEXT,
    "employmentType" TEXT,
    "workSetting" TEXT,
    "companySize" TEXT,
    "salariesReported" INTEGER,
    "employmentStatus" TEXT,
    "jobId" INTEGER NOT NULL,
    "employeeCountryId" INTEGER,
    "companyCountryId" INTEGER,
    "companyId" INTEGER,
    "cityId" INTEGER,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Country_name_key" ON "Country"("name");

-- CreateIndex
CREATE UNIQUE INDEX "City_name_state_countryId_key" ON "City"("name", "state", "countryId");

-- CreateIndex
CREATE UNIQUE INDEX "JobCategory_name_key" ON "JobCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Job_title_categoryId_key" ON "Job"("title", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");

-- CreateIndex
CREATE INDEX "SalaryRecord_jobId_idx" ON "SalaryRecord"("jobId");

-- CreateIndex
CREATE INDEX "SalaryRecord_employeeCountryId_idx" ON "SalaryRecord"("employeeCountryId");

-- CreateIndex
CREATE INDEX "SalaryRecord_companyCountryId_idx" ON "SalaryRecord"("companyCountryId");

-- CreateIndex
CREATE INDEX "SalaryRecord_companyId_idx" ON "SalaryRecord"("companyId");

-- CreateIndex
CREATE INDEX "SalaryRecord_cityId_idx" ON "SalaryRecord"("cityId");

-- CreateIndex
CREATE INDEX "SalaryRecord_workYear_idx" ON "SalaryRecord"("workYear");

-- CreateIndex
CREATE INDEX "SalaryRecord_experienceLevel_idx" ON "SalaryRecord"("experienceLevel");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "City" ADD CONSTRAINT "City_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "JobCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryRecord" ADD CONSTRAINT "SalaryRecord_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryRecord" ADD CONSTRAINT "SalaryRecord_employeeCountryId_fkey" FOREIGN KEY ("employeeCountryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryRecord" ADD CONSTRAINT "SalaryRecord_companyCountryId_fkey" FOREIGN KEY ("companyCountryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryRecord" ADD CONSTRAINT "SalaryRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryRecord" ADD CONSTRAINT "SalaryRecord_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryRecord" ADD CONSTRAINT "SalaryRecord_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
