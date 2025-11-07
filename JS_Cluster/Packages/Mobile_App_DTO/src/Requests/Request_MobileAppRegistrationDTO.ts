import * as z from 'zod'


export const RegistrationRequestDTOSchema = z.object({
  fullName: z
    .string()
    .min(2, "Họ tên phải có ít nhất 2 ký tự.")
    .max(50, "Họ tên không được vượt quá 50 ký tự.")
    .regex(/^[\p{L}\s'.-]+$/u, "Họ tên chứa ký tự không hợp lệ."),

  phoneNumber: z
    .string()
    .regex(/^(0|\+84)(\d{9})$/, "Số điện thoại không hợp lệ. Ví dụ: 0987654321 hoặc +84987654321."),

  password: z
    .string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự.")
    .max(64, "Mật khẩu không được vượt quá 64 ký tự.")
    .regex(/[A-Z]/, "Mật khẩu phải chứa ít nhất 1 chữ in hoa.")
    .regex(/[a-z]/, "Mật khẩu phải chứa ít nhất 1 chữ thường.")
    .regex(/\d/, "Mật khẩu phải chứa ít nhất 1 chữ số.")
    .regex(/[@$!%*?&]/, "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt."),
});

export type Request_MobileAppRegistrationDTO = z.infer<typeof RegistrationRequestDTOSchema>;