package com.fintrack.controller;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * End-to-end MockMvc test against the real security chain and an in-memory H2 database.
 * It covers registration, login, protected endpoints, transaction ownership, and dashboard totals.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FinTrackIntegrationTest {

    @Autowired
    private MockMvc mvc;
    @Autowired
    private ObjectMapper objectMapper;

    private String register(String name, String email) throws Exception {
        String body = """
                {"name":"%s","email":"%s","password":"password123"}
                """.formatted(name, email);
        MvcResult result = mvc.perform(post("/api/auth/register").contentType("application/json").content(body))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }

    private long createTransaction(String token, String json) throws Exception {
        MvcResult result = mvc.perform(post("/api/transactions").header("Authorization", "Bearer " + token)
                        .contentType("application/json").content(json))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        return node.get("id").asLong();
    }

    @Test
    void registrationRejectsDuplicateEmailAndInvalidInput() throws Exception {
        register("Bo", "bo@example.com");
        mvc.perform(post("/api/auth/register").contentType("application/json")
                        .content("{\"name\":\"Bo\",\"email\":\"BO@example.com\",\"password\":\"password123\"}"))
                .andExpect(status().isConflict());
        mvc.perform(post("/api/auth/register").contentType("application/json")
                        .content("{\"name\":\"\",\"email\":\"not-an-email\",\"password\":\"short\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.email").exists());
    }

    @Test
    void loginRejectsWrongPassword() throws Exception {
        register("Cy", "cy@example.com");
        mvc.perform(post("/api/auth/login").contentType("application/json")
                        .content("{\"email\":\"cy@example.com\",\"password\":\"wrong-password\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password."));
    }

    @Test
    void protectedEndpointsRejectMissingAndInvalidTokens() throws Exception {
        mvc.perform(get("/api/transactions")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/transactions").header("Authorization", "Bearer not-a-real-token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message", containsString("sign in again")));
    }

    @Test
    void usersCannotReadOrModifyEachOthersTransactions() throws Exception {
        String ownerToken = register("Di", "di@example.com");
        String otherToken = register("Ed", "ed@example.com");
        long txId = createTransaction(ownerToken,
                "{\"title\":\"Rent\",\"amount\":900,\"type\":\"EXPENSE\",\"category\":\"BILLS\",\"transactionDate\":\"2026-10-02\"}");

        mvc.perform(get("/api/transactions/" + txId).header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());
        mvc.perform(delete("/api/transactions/" + txId).header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/transactions/" + txId).header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());
    }

    @Test
    void rejectsCategoryTypeMismatchAndNonPositiveAmount() throws Exception {
        String token = register("Fay", "fay@example.com");
        mvc.perform(post("/api/transactions").header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("{\"title\":\"X\",\"amount\":10,\"type\":\"INCOME\",\"category\":\"FOOD\",\"transactionDate\":\"2026-10-02\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/transactions").header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("{\"title\":\"X\",\"amount\":0,\"type\":\"EXPENSE\",\"category\":\"FOOD\",\"transactionDate\":\"2026-10-02\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.amount").exists());
    }

    @Test
    void dashboardTotalsReflectCreatedTransactionsAndBudgetUsage() throws Exception {
        String token = register("Gus", "gus@example.com");
        createTransaction(token, "{\"title\":\"Pay\",\"amount\":3000,\"type\":\"INCOME\",\"category\":\"SALARY\",\"transactionDate\":\"2026-09-30\"}");
        createTransaction(token, "{\"title\":\"Lunch\",\"amount\":400,\"type\":\"EXPENSE\",\"category\":\"FOOD\",\"transactionDate\":\"2026-09-12\"}");
        createTransaction(token, "{\"title\":\"Outside month\",\"amount\":99,\"type\":\"EXPENSE\",\"category\":\"FOOD\",\"transactionDate\":\"2026-08-31\"}");

        mvc.perform(post("/api/budgets").header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("{\"category\":\"FOOD\",\"month\":\"2026-09\",\"amount\":500}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.spent").value(400))
                .andExpect(jsonPath("$.status").value("WARNING"));

        mvc.perform(get("/api/dashboard?month=2026-09").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalIncome").value(3000))
                .andExpect(jsonPath("$.totalExpenses").value(400))
                .andExpect(jsonPath("$.netSavings").value(2600))
                .andExpect(jsonPath("$.expenseByCategory", hasSize(1)))
                .andExpect(jsonPath("$.budgets[0].category").value("FOOD"));
    }

    @Test
    void reportsSummaryAggregatesMultiMonthTotalsAndIsolatesUsers() throws Exception {
        String tokenUserA = register("Hank", "hank@example.com");
        String tokenUserB = register("Ivy", "ivy@example.com");

        createTransaction(tokenUserA, "{\"title\":\"July Salary\",\"amount\":4000,\"type\":\"INCOME\",\"category\":\"SALARY\",\"transactionDate\":\"2026-07-05\"}");
        createTransaction(tokenUserA, "{\"title\":\"July Rent\",\"amount\":1000,\"type\":\"EXPENSE\",\"category\":\"BILLS\",\"transactionDate\":\"2026-07-10\"}");
        createTransaction(tokenUserA, "{\"title\":\"Sept Salary\",\"amount\":4500,\"type\":\"INCOME\",\"category\":\"SALARY\",\"transactionDate\":\"2026-09-01\"}");
        createTransaction(tokenUserA, "{\"title\":\"Sept Groceries\",\"amount\":500,\"type\":\"EXPENSE\",\"category\":\"FOOD\",\"transactionDate\":\"2026-09-15\"}");

        createTransaction(tokenUserB, "{\"title\":\"Ivy Secret Income\",\"amount\":9999,\"type\":\"INCOME\",\"category\":\"SALARY\",\"transactionDate\":\"2026-08-15\"}");

        mvc.perform(get("/api/reports/summary?from=2026-07&to=2026-09").header("Authorization", "Bearer " + tokenUserA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.from").value("2026-07"))
                .andExpect(jsonPath("$.to").value("2026-09"))
                .andExpect(jsonPath("$.totalIncome").value(8500))
                .andExpect(jsonPath("$.totalExpenses").value(1500))
                .andExpect(jsonPath("$.netSavings").value(7000))
                .andExpect(jsonPath("$.months", hasSize(3)))
                .andExpect(jsonPath("$.months[0].month").value("2026-07"))
                .andExpect(jsonPath("$.months[0].income").value(4000))
                .andExpect(jsonPath("$.months[0].expenses").value(1000))
                .andExpect(jsonPath("$.months[0].net").value(3000))
                .andExpect(jsonPath("$.months[1].month").value("2026-08"))
                .andExpect(jsonPath("$.months[1].income").value(0))
                .andExpect(jsonPath("$.months[1].expenses").value(0))
                .andExpect(jsonPath("$.months[1].net").value(0))
                .andExpect(jsonPath("$.months[2].month").value("2026-09"))
                .andExpect(jsonPath("$.months[2].income").value(4500))
                .andExpect(jsonPath("$.months[2].expenses").value(500))
                .andExpect(jsonPath("$.months[2].net").value(4000))
                .andExpect(jsonPath("$.expenseByCategory", hasSize(2)));
    }

    @Test
    void registerWithCountryAndCurrency_andUpdatePreferences() throws Exception {
        String registerBody = """
                {"name":"Priya","email":"priya@example.com","password":"password123","countryCode":"IN","currencyCode":"INR"}
                """;
        MvcResult regResult = mvc.perform(post("/api/auth/register")
                        .contentType("application/json").content(registerBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.countryCode").value("IN"))
                .andExpect(jsonPath("$.user.currencyCode").value("INR"))
                .andReturn();

        String token = objectMapper.readTree(regResult.getResponse().getContentAsString()).get("token").asText();

        // Update preferences to Germany / EUR
        String updateBody = """
                {"countryCode":"DE","currencyCode":"EUR"}
                """;
        mvc.perform(put("/api/user/preferences")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json").content(updateBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.countryCode").value("DE"))
                .andExpect(jsonPath("$.currencyCode").value("EUR"));
    }

    @Test
    void updatePreferences_rejectsInvalidCurrencyCode() throws Exception {
        String token = register("Klaus", "klaus@example.com");

        String invalidBody = """
                {"countryCode":"DE","currencyCode":"XYZ9"}
                """;
        mvc.perform(put("/api/user/preferences")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json").content(invalidBody))
                .andExpect(status().isBadRequest());
    }

    @Test
    void savingsGoalCrudWorkflow() throws Exception {
        String token = register("Elena", "elena@example.com");

        // 1. Create a savings goal
        String createGoalJson = """
                {"name":"Emergency Fund","targetAmount":10000.00,"currentAmount":2000.00,"targetDate":"2026-12-31","notes":"6 months buffer"}
                """;
        MvcResult res = mvc.perform(post("/api/savings-goals")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json").content(createGoalJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Emergency Fund"))
                .andExpect(jsonPath("$.targetAmount").value(10000.00))
                .andExpect(jsonPath("$.currentAmount").value(2000.00))
                .andExpect(jsonPath("$.remainingAmount").value(8000.00))
                .andExpect(jsonPath("$.percentSaved").value(20.0))
                .andExpect(jsonPath("$.completed").value(false))
                .andReturn();

        long goalId = objectMapper.readTree(res.getResponse().getContentAsString()).get("id").asLong();

        // 2. Deposit 3000
        mvc.perform(post("/api/savings-goals/" + goalId + "/deposit")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json").content("{\"amount\":3000.00}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentAmount").value(5000.00))
                .andExpect(jsonPath("$.remainingAmount").value(5000.00))
                .andExpect(jsonPath("$.percentSaved").value(50.0));

        // 3. Withdraw 1000
        mvc.perform(post("/api/savings-goals/" + goalId + "/withdraw")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json").content("{\"amount\":1000.00}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentAmount").value(4000.00))
                .andExpect(jsonPath("$.remainingAmount").value(6000.00))
                .andExpect(jsonPath("$.percentSaved").value(40.0));

        // 4. List goals
        mvc.perform(get("/api/savings-goals")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Emergency Fund"));

        // 5. Delete goal
        mvc.perform(delete("/api/savings-goals/" + goalId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        // Verify empty
        mvc.perform(get("/api/savings-goals")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }
}
