import { Request_MobileAppForgetPasswordDTO, Request_MobileAppLogInDTO, Request_MobileAppRegistrationDTO, Response_MobileAppLogInDTO } from "@trungthao/mobile_app_dto";
import { Apis, fetchJSON, jsonHeaders } from "./ApiConfig";

// 🔹 Normal login (username/password)
export const logIn = async (
    payload: Request_MobileAppLogInDTO
): Promise<Response_MobileAppLogInDTO> => {
    const url = `${Apis.authenticate}`;
    return fetchJSON<Response_MobileAppLogInDTO>(url, {
        method: "POST",
        headers: jsonHeaders,
        credentials: "include",
        body: JSON.stringify(payload),
    });
};

// 🔹 Registration
export const signUp = async (
    payload: Request_MobileAppRegistrationDTO
): Promise<void> => {
    const url = `${Apis.registration}`;
    return fetchJSON<void>(url, {
        method: "POST",
        headers: jsonHeaders,
        credentials: "include",
        body: JSON.stringify(payload),
    });
};

// 🔹 Sign in using existing session token
export const signInWithSession = async (
    sessionId: string
): Promise<Response_MobileAppLogInDTO> => {
    const url = `${Apis.authenticateWithSession}`;
    return fetchJSON<Response_MobileAppLogInDTO>(url, {
        method: "GET",
        headers: {
            ...jsonHeaders,
            authorization: `${sessionId}`,
        },
        credentials: "include",
    });
};

export const changePassword = async (
    payload: Request_MobileAppForgetPasswordDTO
): Promise<void> => {
    const url = `${Apis.forgetPassword}`;
    return fetchJSON<void>(url, {
        method: "POST",
        headers: jsonHeaders,
        credentials: "include",
        body: JSON.stringify(payload),
    });
};