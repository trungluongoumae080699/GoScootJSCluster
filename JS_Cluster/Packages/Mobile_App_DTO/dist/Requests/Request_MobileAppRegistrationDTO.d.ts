import * as z from 'zod';
export declare const RegistrationRequestDTOSchema: z.ZodObject<{
    fullName: z.ZodString;
    phoneNumber: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export type Request_MobileAppRegistrationDTO = z.infer<typeof RegistrationRequestDTOSchema>;
