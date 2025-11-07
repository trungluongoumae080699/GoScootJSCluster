import * as z from 'zod';
export declare const LogInRequestDTOSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export type Request_LogInDTO = z.infer<typeof LogInRequestDTOSchema>;
