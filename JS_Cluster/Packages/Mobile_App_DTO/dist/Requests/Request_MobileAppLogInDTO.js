import * as z from 'zod';
export const LogInRequestDTOSchema = z.object({
    phoneNumber: z.string(),
    password: z.string()
});
