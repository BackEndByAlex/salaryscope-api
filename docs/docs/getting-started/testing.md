---
title: Testing
sidebar_position: 3
---

# **Testing Requirements**

All implementations must include thorough testing using Postman to ensure the quality and reliability of the APIs. The testing requirements are designed to cover all endpoints with both positive and negative scenarios, ensuring comprehensive coverage. Additionally, tests must support automated execution within a CI/CD pipeline by using randomly generated data and maintaining independence from the database state.

## **General Guidelines**

- **Use Postman Collections:** Organize your tests within Postman collections, categorizing them based on functionality (e.g., Authentication, Movies, Actors, Ratings).
- **Automate with Newman:** Ensure that your Postman collections can be executed via Newman for integration into CI/CD pipelines.
- **Environment Variables:** Utilize Postman's environment variables to manage dynamic data such as JWT tokens and IDs. Avoid hardcoding sensitive information.
- **Random Data Generation:** Implement pre-request scripts to generate unique and random data for each test run, ensuring tests do not depend on existing database states.

## **Testing for REST APIs**

### **Postman Collection Structure**

- **Minimum:** **20 test cases**
  - **Endpoints to Test:**
    - `POST /users/register`
    - `POST /users/login`
    - `GET /movies`
    - `GET /movies/\{id\}`
    - `POST /movies`
    - `PUT /movies/\{id\}`
    - `DELETE /movies/\{id\}`
    - `GET /movies/\{id\}/ratings`
    - `GET /actors`
    - `GET /ratings`

### **Test Cases Coverage**

For each REST endpoint, implement the following test cases:

#### **1. User Authentication Endpoints**

- **POST /users/register**
  - **Success:** Register a new user with valid data.
  - **Failure:** Attempt to register with an already existing email or missing required fields.

- **POST /users/login**
  - **Success:** Authenticate a user with valid credentials and obtain a JWT token.
  - **Failure:** Attempt to login with invalid credentials.

#### **2. Movie Endpoints**

- **GET /movies**
  - **Success:** Retrieve a list of all movies.
  - **Failure:** Retrieve movies with invalid query parameters.

- **GET /movies/\{id\}**
  - **Success:** Retrieve a specific movie by ID.
  - **Failure:** Retrieve a movie with a non-existent ID (404).

- **POST /movies** (**Requires authentication**)
  - **Success:** Add a new movie with valid data and authentication.
  - **Failure:** Add a new movie without authentication (401) or with invalid data (400).

- **PUT /movies/\{id\}** (**Requires authentication**)
  - **Success:** Update an existing movie with valid data and authentication.
  - **Failure:** Update a movie without authentication (401) or with invalid data (400).

- **DELETE /movies/\{id\}** (**Requires authentication**)
  - **Success:** Delete an existing movie with authentication.
  - **Failure:** Delete a movie without authentication (401) or with a non-existent ID (404).

- **GET /movies/\{id\}/ratings**
  - **Success:** Retrieve ratings for a specific movie.
  - **Failure:** Retrieve ratings for a non-existent movie (404).

#### **3. Actor and Rating Endpoints**

- **GET /actors**
  - **Success:** Retrieve all actors.
  - **Failure:** Retrieve actors with invalid query parameters (if applicable).

- **GET /ratings**
  - **Success:** Retrieve all ratings.
  - **Failure:** Retrieve ratings with invalid query parameters (if applicable).

### **Test Case Structure**

Each test case within the Postman collection **SHOULD** include:

- **Pre-request Scripts or Setup:**
  - **Random Data Generation:** Use Postman's scripting capabilities to generate unique and random data for each test run to avoid dependency on the database state.
    - Example: Generate unique email addresses for user registration.
    - Example: Use random strings or UUIDs for movie titles.
  - **Environment Variables:** Store temporary data such as JWT tokens using Postman's environment variables to ensure secure and isolated test executions.

- **Assertions:**
  - **Status Codes:** Verify response status codes (e.g., 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found).
  - **Headers:** Validate response headers (e.g., `Content-Type: application/json`).
  - **Body Content:** Check response body for correctness and completeness (e.g., required fields are present and correctly formatted).

- **Sequence Tests:**
  - Perform a series of requests where the output of one request is used in another (e.g., register a user, login to obtain a JWT token, add a movie using the token, retrieve the movie, update it, and then delete it).

- **Security Considerations:**
  - **Secure Storage:** Ensure that JWT tokens and passwords are handled securely within Postman by using environment variables and avoiding hardcoding them within test scripts or requests.

## **Testing for GraphQL APIs**

### **Postman Collection Structure**

- **Minimum:** **20 test cases**
  - **GraphQL Operations to Test:**
    - `registerUser`
    - `loginUser`
    - `movies`
    - `movie`
    - `addMovie`
    - `updateMovie`
    - `deleteMovie`
    - `ratings`
    - `actors`
    - `ratings`

### **Test Cases Coverage**

For each GraphQL operation, implement the following test cases:

#### **1. User Authentication Operations**

- **registerUser**
  - **Success:** Register a new user with valid data.
  - **Failure:** Attempt to register with an already existing email or missing required fields.

- **loginUser**
  - **Success:** Authenticate a user with valid credentials and obtain a JWT token.
  - **Failure:** Attempt to login with invalid credentials.

#### **2. Movie Operations**

- **movies**
  - **Success:** Fetch a list of all movies.
  - **Failure:** Fetch movies with invalid query parameters.

- **movie**
  - **Success:** Fetch a specific movie by ID.
  - **Failure:** Fetch a movie with a non-existent ID (null response or error).

- **addMovie** (**Requires authentication**)
  - **Success:** Add a new movie with valid data and authentication.
  - **Failure:** Add a new movie without authentication (authentication error) or with invalid data.

- **updateMovie** (**Requires authentication**)
  - **Success:** Update an existing movie with valid data and authentication.
  - **Failure:** Update a movie without authentication or with invalid data.

- **deleteMovie** (**Requires authentication**)
  - **Success:** Delete an existing movie with authentication.
  - **Failure:** Delete a movie without authentication or with a non-existent ID.

- **ratings**
  - **Success:** Fetch ratings for a specific movie.
  - **Failure:** Fetch ratings for a non-existent movie (null response or error).

#### **3. Actor Operations**

- **actors**
  - **Success:** Fetch all actors.
  - **Failure:** Fetch actors with invalid query parameters (if applicable).

### **Test Case Structure**

Each test case within the Postman collection **SHOULD** include:

- **Pre-request Scripts or Setup:**
  - **Random Data Generation:** Use Postman's scripting capabilities to generate unique and random data for each test run to avoid dependency on the database state.
    - Example: Generate unique email addresses for user registration.
    - Example: Use random strings or UUIDs for movie titles.
  - **Environment Variables:** Store temporary data such as JWT tokens and fetched IDs using Postman's environment variables to ensure secure and isolated test executions.

- **GraphQL Specifics:**
  - **Query Templates:** Use dynamic variables within GraphQL queries to inject test data.
    - Example: Use environment variables to insert the JWT token into the `Authorization` header.
    - Example: Pass dynamically generated IDs or titles within queries and mutations.

- **Assertions:**
  - **Status Codes:** Verify that the HTTP response status code is `200 OK` for successful GraphQL operations or appropriate error codes for failures.
  - **Response Structure:** Ensure that the GraphQL response contains the expected `data` or `errors` fields.
  - **Data Validation:** Check that the returned data matches the input parameters and that required fields are present and correctly formatted.

- **Sequence Tests:**
  - Perform a series of GraphQL operations where the output of one operation is used in another (e.g., register a user, login to obtain a JWT token, add a movie using the token, fetch the movie, update it, and then delete it).

- **Security Considerations:**
  - **Secure Storage:** Ensure that JWT tokens and passwords are handled securely within Postman by using environment variables and avoiding hardcoding them within test scripts or requests.

## **Best Practices for CI/CD Integration**

To ensure that your tests work seamlessly within a CI/CD pipeline, adhere to the following guidelines:

### **Randomized and Independent Data**

- **Avoid Hardcoded Data:** Use dynamic data generation to prevent conflicts and ensure that tests do not depend on the existing state of the database.
- **Isolation:** Each test should set up its own required data and clean up after execution to maintain independence.

### **Test Data Design**

- **Uniqueness:** Design test data (e.g., usernames, movie titles) to be unique for each test run using randomization techniques.
- **Validation:** Ensure that the randomly generated data meets all validation criteria of the API to prevent false negatives.

### **Secure Handling of Secrets**

- **Environment Variables:** Store sensitive information such as JWT tokens and passwords in Postman environment variables rather than in plain text within the collection.
- **Git Ignorance:** Ensure that environment files containing secrets are excluded from version control systems using `.gitignore` or similar mechanisms.

### **Automated Testing Execution**

- **Newman Integration:** Configure your CI/CD pipeline to execute Postman collections using Newman. This ensures that all tests run automatically on every commit and pull request.
- **Test Reporting:** Generate and review test reports to monitor the health of your API continuously. Configure the pipeline to fail if any critical tests do not pass.

## **Submission of Tests**

- **Postman Collection:**
  - Export the Postman collection as a JSON file.
  - Include the collection in your project repository, clearly named (e.g., `MovieDatabaseAPI.postman_collection.json`).

- **Environment Files:**
  - If using Postman environments, provide sample environment files with placeholders (e.g., `example.postman_environment.json`) and instruct users to create their own by replacing placeholders with actual values.

- **Documentation:**
  - Update your project's README file with instructions on how to import and execute the Postman collection.
  - Provide details on how to run tests locally and how they are integrated into the CI/CD pipeline using tools like Newman.

Ensure that your Postman tests are part of the Continuous Integration/Continuous Deployment (CI/CD) pipeline, executing on every commit and pull request to maintain code quality and detect issues early.

## **Applicability to GraphQL APIs**

The testing instructions provided above are designed to be adaptable for both REST and GraphQL APIs using Postman. However, there are specific considerations to ensure effective testing for GraphQL:

1. **Single Endpoint Handling:**
   - **REST:** Involves multiple endpoints (`GET /movies`, `POST /movies`, etc.).
   - **GraphQL:** Utilizes a single endpoint (commonly `/graphql`) where all queries and mutations are processed.

   **Adaptation:**
   - For GraphQL, structure your Postman requests to send different queries and mutations to the single `/graphql` endpoint.
   - Use separate folders or naming conventions within the Postman collection to differentiate between different GraphQL operations.

2. **Request Payload Structure:**
   - **REST:** Typically uses URL parameters for queries and JSON bodies for POST/PUT requests.
   - **GraphQL:** Sends queries and mutations as part of the request body in a specific structure.

   **Adaptation:**
   - In Postman, set the request body to raw JSON format and structure it according to GraphQL standards. For example:
     ```json
     {
       "query": "mutation { addMovie(title: \"Inception\", release_year: 2010, genre: \"Sci-Fi\") { id title } }",
       "variables": {}
     }
     ```
   - Utilize Postman's variables to inject dynamic data into your GraphQL queries and mutations.

3. **Response Validation:**
   - **REST:** Responses are usually straightforward JSON structures corresponding to each endpoint.
   - **GraphQL:** Responses contain a `data` field for successful queries and an `errors` field for any issues.

   **Adaptation:**
   - Update your Postman test scripts to validate the presence of `data` or `errors` in GraphQL responses.
   - Check the specific fields within the `data` object to ensure correctness.

4. **Authentication Headers:**
   - Both REST and GraphQL may require authentication headers (e.g., `Authorization: Bearer <token>`).

   **Adaptation:**
   - Ensure that your Postman environment variables store JWT tokens securely.
   - Use Pre-request Scripts to set the `Authorization` header dynamically based on the environment variable.

5. **Dynamic Variables and IDs:**
   - **REST:** May require fetching IDs from one request to use in another (e.g., fetching a movie ID to update or delete it).
   - **GraphQL:** Similarly, but often more streamlined due to the flexibility of queries.

   **Adaptation:**
   - Use Postman's scripting capabilities to extract IDs and other necessary data from responses and store them in environment variables for use in subsequent requests.

6. **Testing Nested Queries:**
   - **GraphQL:** Allows fetching related data in a single request (e.g., fetching a movie along with its ratings).

   **Adaptation:**
   - Create test cases that leverage nested queries to validate complex data retrieval.
   - Ensure that the assertions cover both the primary and nested data structures.

## **Conclusion**

By following the **Testing Requirements** outlined above and adapting them to the specifics of your GraphQL implementation, you can ensure comprehensive and effective testing for both REST and GraphQL APIs. Leveraging Postman's versatile features, such as scripting, environment variables, and automated test execution with Newman, will facilitate robust testing workflows that seamlessly integrate with your CI/CD pipelines.

Remember to:

- **Customize Test Cases:** Tailor your test cases to reflect the unique aspects of GraphQL, such as handling queries and mutations within a single endpoint.
- **Maintain Security:** Always handle sensitive data securely, especially when dealing with authentication tokens and user credentials.
- **Ensure Independence:** Design tests to be independent and idempotent, allowing them to run reliably in any environment without side effects.
