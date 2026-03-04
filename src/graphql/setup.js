import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { ApolloServer } from "@apollo/server"
import {
  ApolloServerPluginLandingPageLocalDefault,
  ApolloServerPluginLandingPageProductionDefault,
} from "@apollo/server/plugin/landingPage/default"

import prisma from "../config/prismaClient.js"
import { privateKey } from "../config/keys.js"

import { UserRepository } from "../repositories/UserRepository.js"
import { CountryRepository } from "../repositories/CountryRepository.js"
import { JobCategoryRepository } from "../repositories/JobCategoryRepository.js"
import { JobRepository } from "../repositories/JobRepository.js"
import { CompanyRepository } from "../repositories/CompanyRepository.js"
import { SalaryRecordRepository } from "../repositories/SalaryRecordRepository.js"

import { AuthService } from "../auth/AuthService.js"
import { UserService } from "../services/UserService.js"
import { CountryService } from "../services/CountryService.js"
import { JobCategoryService } from "../services/JobCategoryService.js"
import { JobService } from "../services/JobService.js"
import { CompanyService } from "../services/CompanyService.js"
import { SalaryRecordService } from "../services/SalaryRecordService.js"

import { authResolvers } from "../auth/authResolvers.js"
import { countryResolvers } from "./resolvers/countryResolvers.js"
import { jobCategoryResolvers } from "./resolvers/jobCategoryResolvers.js"
import { jobResolvers } from "./resolvers/jobResolvers.js"
import { companyResolvers } from "./resolvers/companyResolvers.js"
import { salaryRecordResolvers } from "./resolvers/salaryRecordResolvers.js"

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadTypeDefs() {
  const schemaDir = join(__dirname, "schema")
  return [
    "schema.graphql",
    "auth.graphql",
    "country.graphql",
    "jobCategory.graphql",
    "job.graphql",
    "company.graphql",
    "salaryRecord.graphql",
  ].map((filename) => readFileSync(join(schemaDir, filename), "utf8"))
}

function createServices() {
  const userRepository = new UserRepository(prisma)
  const countryRepository = new CountryRepository(prisma)
  const jobCategoryRepository = new JobCategoryRepository(prisma)
  const jobRepository = new JobRepository(prisma)
  const companyRepository = new CompanyRepository(prisma)
  const salaryRecordRepository = new SalaryRecordRepository(prisma)

  return {
    authService: new AuthService(userRepository, privateKey),
    userService: new UserService(userRepository),
    countryService: new CountryService(countryRepository),
    jobCategoryService: new JobCategoryService(jobCategoryRepository),
    jobService: new JobService(jobRepository),
    companyService: new CompanyService(companyRepository),
    salaryRecordService: new SalaryRecordService(salaryRecordRepository),
  }
}

export const services = createServices()

export function buildApolloServer() {
  return new ApolloServer({
    typeDefs: loadTypeDefs(),
    resolvers: [
      authResolvers,
      countryResolvers,
      jobCategoryResolvers,
      jobResolvers,
      companyResolvers,
      salaryRecordResolvers,
    ],
    introspection: true, // Enable introspection in production
    plugins: [
      process.env.NODE_ENV === "production"
        ? ApolloServerPluginLandingPageProductionDefault({
            embed: true,
            footer: false,
          })
        : ApolloServerPluginLandingPageLocalDefault({
            embed: true,
            footer: false,
          }),
    ],
  })
}
