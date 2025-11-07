import * as z from 'zod';
export const AdminLogInRequestDTOSchema = z.object({
    email: z.string(),
    password: z.string()
});
