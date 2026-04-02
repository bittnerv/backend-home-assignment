import 'dotenv/config';
import { Connection } from 'rabbitmq-client'

const rabbitUrl = `${process.env.RABBIT_URL}`;

export const carUpdatesQueue = 'car-updates';

export const connectToRabbit = () => {
  const rabbit = new Connection(rabbitUrl)

  rabbit.on('connection', () => {
    console.log('Connection successfully (re)established')
  });

  rabbit.on('error', (error) => {
    console.log('RabbitMQ connection error', error)
  });

  return rabbit;
};
