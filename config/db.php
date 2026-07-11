<?php
/**
 * =========================================================
 *  SafePark — Database Connection File
 *  config/db.php
 * ---------------------------------------------------------
 *  IMPORTANT: This file ONLY opens a connection to the
 *  MySQL database. It intentionally contains NO business
 *  logic (no queries for login, CRUD, or reports). All
 *  application logic lives in the front-end JavaScript
 *  (js/data.js and js/script.js), as required by the
 *  project specification.
 *
 *  This file is provided so the project can be connected to
 *  a real MySQL server (e.g. via a thin JSON API layer) when
 *  moving from the local demo (localStorage) data to a
 *  production database, without changing any HTML/CSS/JS.
 * =========================================================
 */

// ---------- Database configuration ----------
define('DB_HOST', 'localhost');   // MySQL server host
define('DB_NAME', 'safepark_db'); // Database name
define('DB_USER', 'root');        // MySQL username
define('DB_PASS', '');            // MySQL password
define('DB_CHARSET', 'utf8mb4');

/**
 * Open a PDO connection to the SafePark database.
 * Returns a PDO instance on success, or null (with an error
 * logged) on failure — no business logic, just connection.
 */
function getDbConnection(): ?PDO
{
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        return new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (PDOException $e) {
        // Connection failure is logged only; the front-end
        // does not depend on this connection to function
        // since all demo logic runs client-side.
        error_log('SafePark DB connection failed: ' . $e->getMessage());
        return null;
    }
}

// Expose a ready-to-use connection variable for any script
// that includes this file (optional to use).
$pdo = getDbConnection();
