export const validatePassword = (password: string): string | null => {
  if (!password || password.trim() === "") {
    return "Password is required.";
  }
  if (
    password.length < 8 ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[!@#$%^&*(),.?":{}|<>]/.test(password)
  ) {
    return "Password does not meet minimum requirements.";
  }
  return null;
};
