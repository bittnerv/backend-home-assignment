import 'dotenv/config';
import mqtt from 'mqtt';
import { logger } from './logger';

const mqttUrl = `${process.env.MQTT_URL}`;
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`
const mqttClient = mqtt.connect(mqttUrl, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  username: `${process.env.MQTT_USER}`,
  password: `${process.env.MQTT_PASSWORD}`,
  reconnectPeriod: 1000,
});

mqttClient.on('connect', () => {
  logger.info('Connected');
});

mqttClient.on('error', (error) => {
  logger.error('Error happened', error);
});

export { mqttClient };
