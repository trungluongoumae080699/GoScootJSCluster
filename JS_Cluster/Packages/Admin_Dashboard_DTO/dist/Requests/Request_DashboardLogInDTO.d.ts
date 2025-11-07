import * as z from 'zod';
export declare const AdminLogInRequestDTOSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export type Request_DashboardLogInDTO = z.infer<typeof AdminLogInRequestDTOSchema>;
