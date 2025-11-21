
import { CustomRequest } from "../Middlewares/Authorization.js"
import { Response, NextFunction } from "express"
import { getCustomerById, getCustomerByPhoneNumber, insertCustomer } from "../Repositories/MySqlRepo/CustomerRepo.js"
import crypto from "crypto";
import bcrypt from "bcrypt";
import { getSession, LogInType, saveSession, SessionObject } from "../Repositories/RedisRepo/SessionRepo.js";
import { LogInRequestDTOSchema, RegistrationRequestDTOSchema, Request_MobileAppLogInDTO, Request_MobileAppRegistrationDTO, Response_MobileAppLogInDTO } from "@trungthao/mobile_app_dto";
import { getStaffByEmail } from "../Repositories/MySqlRepo/StaffRepo.js";
import { Customer } from "../Models/Customer.js";
import { AdminLogInRequestDTOSchema, Request_DashboardLogInDTO, Response_DashboardLogInDTO } from "@trungthao/admin_dashboard_dto";
import { createTempUser } from "../Repositories/mqttRepo/mqttDynamicSecurity.js";

export const authenticateCustomer = async (request: CustomRequest<{}, {}, Request_MobileAppLogInDTO>, response: Response, next: NextFunction) => {
    const parsed = LogInRequestDTOSchema.safeParse(request.body)
    if (!parsed.success) {
        return response.status(400).json({
            message: "Dữ kiệu không chính xác, xin vui lòng thử lại"
        });
    }
    const { phone_number, password } = parsed.data
    const user = await getCustomerByPhoneNumber(phone_number)
    if (!user) {
        return response.status(401).json({
            message: "Số điện thoại hoặc mật khẩu không đúng. Xin vui lòng thử lại"
        })
    }
    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
        return response.status(401).json({
            message: "Số điện thoại hoặc mật khẩu không đúng. Xin vui lòng thử lại"
        })
    }
    const sessionObject: SessionObject = {
        _id: crypto.randomUUID(),
        userId: user.id,
        validPeriod: 3600000,
        createdAt: new Date(),
        logInType: LogInType.CUSTOMER
    }

    await saveSession(sessionObject)

    const responseObject: Response_MobileAppLogInDTO = {
        user_profile: {
            id: user.id,
            full_name: user.full_name,
            phone_number: user.password
        },
        session_id: sessionObject._id

    }
    response.status(200).json(responseObject)
}

export const formlessAuthenticateCustomer = async (request: CustomRequest, response: Response) => {
    let session: SessionObject | null = null
    const sessionId = request.headers["authorization"] as string | undefined;
    if (sessionId) {
        session = await getSession(sessionId);
        if (session) {
            const now = Date.now();
            const createdAtMs = new Date(session.createdAt).getTime();
            const expiryMs = createdAtMs + session.validPeriod;
            if (now > expiryMs) {
                response.status(401).json({ message: "Phiên đăng nhập đã hết hạn." });
                return;
            }
            const user: Customer | null = await getCustomerById(session.userId)
            if (user) {
                const res: Response_MobileAppLogInDTO = {
                    user_profile: {
                        id: user.id,
                        full_name: user.full_name,
                        phone_number: user.password
                    },
                    session_id: session._id
                }
                response.status(200).json(res)
            } else {
                response.status(401).json({ message: "Không tìm thấy người dùng" });
                return;
            }


        }
    }
    if (!sessionId || !session) {
        response.status(401).json({ message: "Thiếu mã phiên đăng nhập." });
        return;
    }
}

export const registerCustomer = async (request: CustomRequest<{}, {}, Request_MobileAppRegistrationDTO>, response: Response, next: NextFunction) => {
    console.log("Registering Customer")
    const parsed = RegistrationRequestDTOSchema.safeParse(request.body);
    if (!parsed.success) {
        const firstError = parsed.error.issues[0].message; // show the first field’s message
        return response.status(400).json({
            message: firstError
        });
    }
    const { full_name, phone_number, password } = parsed.data;

    try {
        // 2) Hash password
        const hashed = await bcrypt.hash(password, 12);

        // 3) Insert into DB
        const id = crypto.randomUUID();
        await insertCustomer(id, full_name, phone_number, hashed);

        // 4) Created
        return response.status(201).json({ id, full_name, phone_number });
    } catch (err: any) {
        // MySQL duplicate key error -> 409 Conflict
        if (err?.code === "ER_DUP_ENTRY") {
            return response.status(400).json({ message: "Số điện thoại đã được đăng ký." });
        }
    }
}

export const authenticateAdmin = async (
  request: CustomRequest<{}, {}, Request_DashboardLogInDTO>,
  response: Response,
  next: NextFunction
) => {
  const parsed = AdminLogInRequestDTOSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({
      message: "Dữ kiệu không chính xác, xin vui lòng thử lại",
    });
  }

  const { email, password } = parsed.data;
  const user = await getStaffByEmail(email);

  if (!user) {
    return response.status(401).json({
      message: "Email hoặc mật khẩu không đúng. Xin vui lòng thử lại",
    });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return response.status(401).json({
      message: "Email hoặc mật khẩu không đúng. Xin vui lòng thử lại...",
    });
  }

  // 1️⃣ Create session
  const sessionObject: SessionObject = {
    _id: crypto.randomUUID(),
    userId: user.id,
    validPeriod: 3600000,
    createdAt: new Date(),
    logInType: LogInType.ADMIN,
  };

  await saveSession(sessionObject);

  // 2️⃣ Create temporary MQTT user based on session ID
  const mqttUsername = sessionObject._id;       // username = sessionId
  const mqttPassword = crypto.randomBytes(16).toString("base64");  // strong random pass

  try {
    await createTempUser(mqttUsername, mqttPassword);
    console.log(`[MQTT] Temporary user created: ${mqttUsername}`);
  } catch (err) {
    console.error("[MQTT] Failed to create temporary MQTT user", err);
    return response.status(500).json({
      message: "Đăng nhập thất bại. Không thể tạo MQTT session.",
    });
  }

  // 3️⃣ Prepare response
  const responseObject: Response_DashboardLogInDTO = {
    staffProfile: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
    },
    sessionId: sessionObject._id,
    mqtt_password: mqttPassword
  };

  response.status(200).json(responseObject);
};