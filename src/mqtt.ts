import 'dotenv/config';
import mqtt from 'mqtt';
import { logger } from './logger';

const mqttUrl = `${process.env.MQTT_URL}`;
const username = `${process.env.MQTT_USER}`;
const password = `${process.env.MQTT_PASSWORD}`;

export const createMqttClient = () => {
  const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;
  const mqttClient = mqtt.connect(mqttUrl, {
    clientId,
    clean: true,
    connectTimeout: 4000,
    username,
    password,
    reconnectPeriod: 1000,
  });

  mqttClient.on('connect', () => {
    logger.info('Connected');
  });

  mqttClient.on('error', (error) => {
    logger.error('Error happened', error);
  });

  return mqttClient;
};

export const subscribeToMqttTopic = (
  mqttClient: mqtt.MqttClient, 
  topic: string | string[], 
  onMessage: (topic: string, payload: Buffer<ArrayBufferLike>) => void,
) => {
  mqttClient.on('connect', () => {
    mqttClient.subscribe(topic, () => {
       logger.info('Subscribed to topic', topic);
    });
  });
  
  mqttClient.on('message', onMessage);
};
