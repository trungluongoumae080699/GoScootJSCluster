import { adminMqttClient, config } from "../../MqttConfig.js";


export interface DynSecCommand {
    command: string;
    username?: string;
    password?: string;
    roles?: string[];
}

export interface DynSecPayload {
    commands: DynSecCommand[];
}

/**
 * Publish a Dynamic Security command
 */
function sendDynSecCommand(payload: DynSecPayload): Promise<void> {
    return new Promise((resolve, reject) => {
        if (adminMqttClient) {
            adminMqttClient.publish(
                config.controlTopic,
                JSON.stringify(payload),
                { qos: 1 },
                (err) => (err ? reject(err) : resolve())
            );
        }

    });
}

/**
 * Create a temporary MQTT user for a dashboard session
 */
export async function createTempUser(
    username: string,
    password: string
): Promise<void> {
    const payload: DynSecPayload = {
        commands: [
            {
                command: "createClient",
                username,
                password,
                roles: ["dashboard_reader"], // Assign the correct MQTT role
            },
        ],
    };

    await sendDynSecCommand(payload);
}

/**
 * Rotate password (for same username)
 */
export async function rotatePassword(
    username: string,
    password: string
): Promise<void> {
    await sendDynSecCommand({
        commands: [
            {
                command: "setClientPassword",
                username,
                password,
            },
        ],
    });
}

/**
 * Delete a temporary client (on logout or expiration)
 */
export async function deleteUser(username: string): Promise<void> {
    await sendDynSecCommand({
        commands: [
            {
                command: "deleteClient",
                username,
            },
        ],
    });
}