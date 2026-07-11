<?php
/**
 * register.php — SafePark Registration Page
 * -------------------------------------------------------
 * Same rule as index.php: PHP is used ONLY to include the
 * database connection file. Account creation, validation
 * and session handling all happen client-side in
 * js/data.js (SafeParkAuth.register) and js/script.js.
 */
require_once __DIR__ . '/config/db.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SafePark | Create Account</title>
<link rel="icon" href="icons/logo.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/style.css">
</head>
<body data-page="register">

  <div class="login-page">

    <!-- Left visual panel -->
    <section class="login-visual">
      <img src="images/login-bg.svg" class="bg-art" alt="">
      <div class="login-brand">
        <img src="icons/logo.svg" alt="SafePark logo">
        SafePark
      </div>

      <div class="login-copy">
        <h1>Join the team managing smarter parking.</h1>
        <p>Create an administrator account to manage drivers, vehicles, parking slots, entries, exits and payments — all in one clean dashboard.</p>
      </div>

      <div class="login-stats">
        <div><strong>24</strong><span>Parking Slots</span></div>
        <div><strong>Live</strong><span>Occupancy Tracking</span></div>
        <div><strong>100%</strong><span>Digital Records</span></div>
      </div>
    </section>

    <!-- Right form panel -->
    <section class="login-form-side">
      <div class="login-box">
        <h2>Create your account</h2>
        <p class="sub">Register a new SafePark administrator account.</p>

        <div class="login-error" id="registerError"></div>

        <form id="registerForm" novalidate>
          <div class="form-group">
            <label for="regName">Full Name</label>
            <div class="input-wrap">
              <img src="icons/user.svg" class="icon" alt="">
              <input type="text" id="regName" placeholder="e.g. Ahmed Hassan" required>
            </div>
          </div>

          <div class="form-group">
            <label for="regEmail">Email Address</label>
            <div class="input-wrap">
              <img src="icons/user.svg" class="icon" alt="">
              <input type="email" id="regEmail" placeholder="you@safepark.com" required>
            </div>
          </div>

          <div class="form-group">
            <label for="regPassword">Password</label>
            <div class="input-wrap">
              <img src="icons/settings.svg" class="icon" alt="">
              <input type="password" id="regPassword" placeholder="At least 6 characters" required minlength="6">
              <button type="button" class="toggle-pass" id="toggleRegPass">SHOW</button>
            </div>
          </div>

          <div class="form-group">
            <label for="regConfirmPassword">Confirm Password</label>
            <div class="input-wrap">
              <img src="icons/settings.svg" class="icon" alt="">
              <input type="password" id="regConfirmPassword" placeholder="Re-enter your password" required minlength="6">
            </div>
          </div>

          <div class="form-row-between">
            <label class="remember"><input type="checkbox" required> I agree to the terms & conditions</label>
          </div>

          <button type="submit" class="btn btn-primary btn-block">Create Account</button>
        </form>

        <div class="login-demo">
          Already have an account? <a href="index.php" class="forgot-link">Sign in here</a>
        </div>
      </div>
    </section>

  </div>

  <script src="js/data.js"></script>
  <script src="js/script.js"></script>
</body>
</html>
