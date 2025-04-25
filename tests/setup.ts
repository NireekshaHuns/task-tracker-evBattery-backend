import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Create test environment
dotenv.config({ path: ".env.test" });

// Configure test data directory
const TEST_DB_DIR = path.join(__dirname, "../data_test");

// Override data directory for tests
process.env.DATA_PATH = TEST_DB_DIR;
process.env.JWT_SECRET = "test_jwt_secret";

// Global setup - run once before all tests
beforeAll(() => {
  console.log("=== Setting up test environment ===");

  // Ensure test data directory exists
  if (!fs.existsSync(TEST_DB_DIR)) {
    fs.mkdirSync(TEST_DB_DIR, { recursive: true });
    console.log(`Created test directory: ${TEST_DB_DIR}`);
  } else {
    console.log(`Using existing test directory: ${TEST_DB_DIR}`);
  }

  // Clean directory contents
  const files = fs.readdirSync(TEST_DB_DIR);
  files.forEach((file) => {
    fs.unlinkSync(path.join(TEST_DB_DIR, file));
  });
  console.log(`Cleaned test directory, removed ${files.length} files`);

  // Create empty test data files
  const dataFiles = [
    "users.json",
    "tasks.json",
    "logs.json",
    "notifications.json",
  ];
  dataFiles.forEach((file) => {
    const filePath = path.join(TEST_DB_DIR, file);
    fs.writeFileSync(filePath, JSON.stringify([]));
    console.log(`Initialized empty ${file}`);
  });
});

// Reset database state before EACH test
beforeEach(() => {
  jest.resetModules(); // Reset module cache

  // This is critical - reset all database files before each test
  const dataFiles = [
    "users.json",
    "tasks.json",
    "logs.json",
    "notifications.json",
  ];
  dataFiles.forEach((file) => {
    const filePath = path.join(TEST_DB_DIR, file);
    // Ensure file exists
    if (fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([]));
    } else {
      fs.writeFileSync(filePath, JSON.stringify([]));
    }
  });
});

// Clean up test data directory after all tests
afterAll(() => {
  console.log("=== Cleaning up test environment ===");
  if (fs.existsSync(TEST_DB_DIR)) {
    fs.rmSync(TEST_DB_DIR, { recursive: true, force: true });
    console.log(`Removed test directory: ${TEST_DB_DIR}`);
  }
});
