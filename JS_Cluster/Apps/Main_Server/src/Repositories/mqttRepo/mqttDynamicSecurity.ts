import { adminMqttClient, config } from "../../MqttConfig.js";


export interface DynSecCommand {
  command: string;
  username?: string;
  password?: string;
  rolename?: string;
  priority?: number;
}

export interface DynSecPayload {
  commands: DynSecCommand[];
}

/**
 * Publish a Dynamic Security command
 */
function sendDynSecCommand(payload: DynSecPayload): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!adminMqttClient || !adminMqttClient.connected) {
      return reject(new Error("adminMqttClient not connected"));
    }

    const json = JSON.stringify(payload);
    console.log("[MQTT][DynSec] Publishing to", config.controlTopic, "=>", json);

    adminMqttClient.publish(
      config.controlTopic,
      json,
      { qos: 1 },
      (err) => (err ? reject(err) : resolve())
    );
  });
}

/**
 * Create a temporary MQTT user for a dashboard session
 *  - creates client
 *  - assigns dashboard_reader role
 */
export async function createTempUser(
  username: string,
  password: string
): Promise<void> {
  console.log("[MQTT][DynSec] Creating temp user:", username);

  const payload: DynSecPayload = {
    commands: [
      {
        command: "createClient",
        username,
        password,
      },
      {
        command: "addClientRole",
        username,
        rolename: "dashboard_reader",
        priority: 0,
      },
    ],
  };

  await sendDynSecCommand(payload);
  console.log("[MQTT][DynSec] Temp user created (requested):", username);
}

export async function createBikeUser(
  username: string,
  password: string
): Promise<void> {
  console.log("[MQTT][DynSec] Creating temp user:", username);

  const payload: DynSecPayload = {
    commands: [
      {
        command: "createClient",
        username,
        password,
      },
      {
        command: "addClientRole",
        username,
        rolename: "bike_publisher",
        priority: 0,
      },
    ],
  };

  await sendDynSecCommand(payload);
  console.log("[MQTT][DynSec] Bike user created (requested):", username);
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