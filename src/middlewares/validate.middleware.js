export const validateSignup = (req, res, next) => {
  let { firstName, email, phone } = req.body;
  const { password, confirmPassword } = req.body;

  firstName = firstName?.trim();
  email = email?.trim();
  phone = phone?.trim();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

  if (!firstName || !email || !password || !confirmPassword) {
    return next({
      statusCode: 400,
      message: "All required fields must be filled"
    });
  }

  if (!emailRegex.test(email)) {
    return next({
      statusCode: 400,
      message: "Invalid email format Ex: user@email.com"
    });
  }

  if (phone && !/^[0-9]{10}$/.test(phone)) {
    return next({
      statusCode: 400,
      message: "Invalid phone number"
    });
  }

  if (!strongPassword.test(password)) {
    return next({
      statusCode: 400,
      message:
        "Password must contain uppercase, lowercase, digit, special char, and be 8+ characters"
    });
  }

  if (password !== confirmPassword) {
    return next({
      statusCode: 400,
      message: "Passwords do not match"
    });
  }

  next();
};

export const validateLogin = (req, res, next) => {
  let { email } = req.body;
  const { password } = req.body;

  email = email?.trim();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !password) {
    return next({
      statusCode: 400,
      message: "Email and password are required"
    });
  }

  if (!emailRegex.test(email)) {
    return next({
      statusCode: 400,
      message: "Invalid email format"
    });
  }

  next();
};
