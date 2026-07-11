<?php
/**
 * index.php — SafePark Login Page
 * -------------------------------------------------------
 * NOTE: Per project requirements, PHP is used ONLY to open
 * the MySQL connection (config/db.php). No business logic,
 * authentication, or page logic runs in PHP — everything
 * the user sees and interacts with is handled by HTML, CSS
 * and vanilla JavaScript (js/data.js + js/script.js).
 *
 * The include below simply demonstrates/prepares the DB
 * connection so the project is ready to be wired to a real
 * back-end (e.g. via a thin JSON API) without changing the
 * front-end at all.
 */
require_once __DIR__ . '/config/db.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SafePark | Sign In</title>
<link rel="icon" href="icons/logo.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/style.css">
</head>
<body data-page="login">

  <div class="login-page">

    <!-- Left visual panel -->
    <section class="login-visual">
      <img src="images/login-bg.svg" class="bg-art" alt="">
      <div class="login-brand">
        <img src="icons/logo.svg" alt="SafePark logo">
        SafePark
      </div>

      <div class="login-copy">
        <h1>Smart parking management, simplified.</h1>
        <p>Monitor slots, track vehicles, manage drivers and generate reports — all from a single, elegant dashboard built for modern parking facilities.</p>
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
        <h2>Welcome back</h2>
        <p class="sub">Sign in to access the SafePark admin dashboard.</p>

        <div class="login-error" id="loginError"></div>

        <form id="loginForm" novalidate>
          <div class="form-group">
            <label for="email">Email Address</label>
            <div class="input-wrap">
              <img src="icons/user.svg" class="icon" alt="">
              <input type="email" id="email" placeholder="admin@safepark.com" required value="admin@safepark.com">
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <div class="input-wrap">
              <img src="icons/settings.svg" class="icon" alt="">
              <input type="password" id="password" placeholder="Enter your password" required value="admin123">
              <button type="button" class="toggle-pass" id="togglePass">SHOW</button>
            </div>
          </div>

          <div class="form-row-between">
            <label class="remember"><input type="checkbox" checked> Remember me</label>
            <a href="#" class="forgot-link">Forgot password?</a>
          </div>

          <button type="submit" class="btn btn-primary btn-block">Sign In</button>
        </form>

        <div class="login-demo">
          <strong>Demo credentials:</strong> admin@safepark.com / admin123
        </div>

        <p style="text-align:center; margin-top:18px; font-size:13.5px; color:var(--text-400);">
          Don't have an account? <a href="register.php" class="forgot-link">Create one</a>
        </p>
      </div>
    </section>

  </div>

  <script src="js/data.js"></script>
  <script src="js/script.js"></script>
</body>
</html>
