export interface RegisterFormValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginFormValues {
  email: string;
  password: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegister(values: RegisterFormValues): Partial<Record<keyof RegisterFormValues, string>> {
  const errors: Partial<Record<keyof RegisterFormValues, string>> = {};
  if (!values.fullName.trim()) errors.fullName = "Vui lòng nhập họ tên.";
  else if (values.fullName.trim().length > 150) errors.fullName = "Họ tên tối đa 150 ký tự.";
  if (!values.email.trim()) errors.email = "Vui lòng nhập email.";
  else if (!emailPattern.test(values.email.trim())) errors.email = "Email không hợp lệ.";
  else if (values.email.trim().length > 320) errors.email = "Email tối đa 320 ký tự.";
  if (!values.password) errors.password = "Vui lòng nhập mật khẩu.";
  else if (values.password.length < 8) errors.password = "Mật khẩu cần ít nhất 8 ký tự.";
  else if (values.password.length > 128) errors.password = "Mật khẩu tối đa 128 ký tự.";
  if (!values.confirmPassword) errors.confirmPassword = "Vui lòng xác nhận mật khẩu.";
  else if (values.confirmPassword !== values.password) errors.confirmPassword = "Mật khẩu xác nhận không khớp.";
  return errors;
}

export function validateLogin(values: LoginFormValues): Partial<Record<keyof LoginFormValues, string>> {
  const errors: Partial<Record<keyof LoginFormValues, string>> = {};
  if (!values.email.trim()) errors.email = "Vui lòng nhập email.";
  else if (!emailPattern.test(values.email.trim())) errors.email = "Email không hợp lệ.";
  if (!values.password) errors.password = "Vui lòng nhập mật khẩu.";
  return errors;
}
