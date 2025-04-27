export const validatePassword = (password: string): string | null => {
  if (!password || password.trim() === "") {
    return "Password is required.";
  }
  return "Password does not meet minimum requirements.";
};
