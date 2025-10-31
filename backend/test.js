const { registerUser, loginUser } = require("./services/authService");
const pool = require("./config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Use jest.mock() to replace the actual implementations of these modules
// with mock functions.
jest.mock("./config/db");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

describe("Authentication Functions", () => {
  // Clears all mock data after each test to ensure tests are independent
  afterEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Tests for registerUser
  // --------------------------------------------------------------------------
  describe("registerUser", () => {
    test("should successfully register a new user", async () => {
      // Mock the first pool.query call to return an empty array,
      // simulating that no existing user was found.
      pool.query.mockResolvedValueOnce([[]]);

      // Mock bcrypt to return a fake hashed password.
      bcrypt.hash.mockResolvedValue("hashedPassword123");

      // Mock the second pool.query call for the INSERT statement.
      pool.query.mockResolvedValueOnce([{ insertId: 1 }]);

      const newUser = await registerUser(
        "test@example.com",
        "password123",
        "testuser",
        "Test",
        "User"
      );

      // Assert that the mocked functions were called with the correct arguments.
      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(newUser).toEqual({
        user_id: 1,
        email: "test@example.com",
        username: "testuser",
        firstname: "Test",
        lastname: "User",
      });
    });

    test("should throw an error if a user with the same email or username already exists", async () => {
      // Mock the database to return an existing user.
      pool.query.mockResolvedValueOnce([[{ user_id: 1 }]]);

      // Expect the function to reject and throw the specific error.
      await expect(
        registerUser(
          "existing@example.com",
          "password123",
          "existinguser",
          "Existing",
          "User"
        )
      ).rejects.toThrow("User with this email or username already exists");

      // Verify that bcrypt.hash was not called because the function exited early.
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // Tests for loginUser
  // --------------------------------------------------------------------------
  describe("loginUser", () => {
    const mockUser = {
      user_id: 1,
      email: "test@example.com",
      username: "testuser",
      password: "hashedPassword123",
      firstname: "Test",
      lastname: "User",
    };

    test("should successfully log in a user and return a token", async () => {
      // Mock the database to return a user object.
      pool.query.mockResolvedValueOnce([[mockUser]]);

      // Mock the password comparison to be successful.
      bcrypt.compare.mockResolvedValue(true);

      // Mock the JWT signing function.
      jwt.sign.mockReturnValue("fake_jwt_token");

      const result = await loginUser("testuser", "password123");

      // Assertions
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password123",
        "hashedPassword123"
      );
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          user_id: 1,
          email: "test@example.com",
          username: "testuser",
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      expect(result).toEqual({
        user_id: 1,
        email: "test@example.com",
        username: "testuser",
        firstname: "Test",
        lastname: "User",
        token: "fake_jwt_token",
      });
    });

    test("should throw an error if the user is not found", async () => {
      // Mock the database to return an empty array.
      pool.query.mockResolvedValueOnce([[]]);

      await expect(loginUser("unknownuser", "password")).rejects.toThrow(
        "User not found"
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    test("should throw an error for an invalid password", async () => {
      // Mock the database to return a user object.
      pool.query.mockResolvedValueOnce([[mockUser]]);

      // Mock password comparison to fail.
      bcrypt.compare.mockResolvedValue(false);

      await expect(loginUser("testuser", "wrongpassword")).rejects.toThrow(
        "Invalid password"
      );
    });
  });
});