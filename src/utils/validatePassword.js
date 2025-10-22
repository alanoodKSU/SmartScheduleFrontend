export function validatePassword(password) {
  const rules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(password),
  };

  // figure out which rules failed
  const missing = [];
  if (!rules.length) missing.push("• at least 8 characters");
  if (!rules.uppercase) missing.push("• an uppercase letter");
  if (!rules.number) missing.push("• a number");
  if (!rules.special) missing.push("• a special symbol");

  const passed = Object.values(rules).filter(Boolean).length;
  const progress = (passed / 4) * 100;

  let strength = "";
  let color = "";

  if (passed === 0) {
    strength = "";
    color = "#dee2e6";
  } else if (passed <= 1) {
    strength = "Weak";
    color = "#dc3545";
  } else if (passed === 2) {
    strength = "Fair";
    color = "#ffc107";
  } else if (passed === 3) {
    strength = "Good";
    color = "#17a2b8";
  } else {
    strength = "Strong";
    color = "#28a745";
  }

  return {
    isValid: passed === 4,
    missing,
    strength,
    color,
    progress,
  };
}
