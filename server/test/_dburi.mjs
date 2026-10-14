/**
 * Works out which database the tests should use.
 *
 * Order of preference:
 *   1. TEST_MONGODB_URI, if you set it
 *   2. MONGODB_URI from your .env, with the database name swapped
 *
 * Option 2 means `npm run test:api` works with no setup at all, including on
 * MongoDB Atlas. Your real database is never touched: the name is always
 * replaced with a test one, and there is a hard check below that refuses to
 * run against anything not clearly named as a test database.
 *
 * Each test file passes its own name, so the files do not wipe each other
 * when the test runner runs them at the same time.
 */
import "dotenv/config";

/** Replace the database name in a MongoDB connection string. */
export function withDbName(uri, dbName) {
  // mongodb://user:pass@host1:27017,host2:27017/olddb?options
  // mongodb+srv://user:pass@host/olddb?options
  const match = /^(mongodb(?:\+srv)?:\/\/)([^/?]*)(\/[^?]*)?(\?.*)?$/.exec(uri);
  if (!match) {
    throw new Error(`Could not read the MongoDB connection string: ${uri}`);
  }
  const [, scheme, credentialsAndHosts, , query = ""] = match;
  return `${scheme}${credentialsAndHosts}/${dbName}${query}`;
}

/**
 * The URI for one test file.
 * @param {string} name a short name for this file, e.g. "api"
 */
export function testDbUri(name) {
  const dbName = `labbook_test_${name}`;

  const explicit = process.env.TEST_MONGODB_URI;
  if (explicit) {
    // Even when set by hand, give each file its own database.
    return withDbName(explicit, dbName);
  }

  const fromEnv = process.env.MONGODB_URI;
  if (!fromEnv) {
    throw new Error(
      "No database to test against.\n" +
        "Either set MONGODB_URI in server/.env (the usual case), or set\n" +
        "TEST_MONGODB_URI to a database the tests may wipe."
    );
  }

  const uri = withDbName(fromEnv, dbName);

  // Last line of defence. These tests call dropDatabase(), so if the name is
  // ever not a test one, stop rather than delete real bookings.
  if (!/\/labbook_test_[a-z0-9_]+(\?|$)/.test(uri)) {
    throw new Error(
      `Refusing to run: the test database name does not look like a test database.\n` +
        `Worked out: ${uri.replace(/\/\/[^@]*@/, "//***:***@")}`
    );
  }

  return uri;
}

/** A friendlier message when the database cannot be reached. */
export function connectionHelp(uri, err) {
  const safe = uri.replace(/\/\/[^@]*@/, "//***:***@");
  return (
    `Could not reach MongoDB.\n` +
    `Tried: ${safe}\n\n` +
    `If you use MongoDB Atlas, check that:\n` +
    `  - MONGODB_URI in server/.env is correct (the app starting up proves it is)\n` +
    `  - your current IP is still allowed under Network Access in Atlas\n` +
    `  - you are online\n\n` +
    `Original error: ${err.message}`
  );
}
