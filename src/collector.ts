import { logger } from './logger';
import { CarStateUpdate } from './db';
import { applyCarDataUpdate, CarData, computeSOC } from './car-data';
import { carUpdatesQueue, connectToRabbit } from './rabbit';
import { createMqttClient, subscribeToMqttTopic } from './mqtt';

const carUpdatesChunkSize = 10;

const carTopics = [
  'car/+/location/latitude',
  'car/+/location/longitude',
  'car/+/speed',
  'car/+/gear',
  'car/+/battery/+/soc',
  'car/+/battery/+/capacity',
];

const cars: Array<CarData> = [];

const buildCarUpdate = (car: CarData): CarStateUpdate => ({
    car_id: car.carId,
    time: new Date(),
    speed: car.speed ?? null,
    gear: car.gear ?? null,
    latitude: car.latitude ?? null,
    longitude: car.longitude ?? null,
    state_of_charge: computeSOC(car.batteries),
});

const handdleMqttTopic = (topic: string, payload: Uint8Array) => {
    const data = JSON.parse(new TextDecoder().decode(payload));
    const [entity, entityId, ...path] = topic.split('/');

    if (entity !== 'car' || !data) return;

    const carId = Number(entityId);

    if (isNaN(carId)) {
        logger.warn('Received car data with invalid car id', topic, data);
        return;
    }

    const existingCar = cars.find(x => x.carId === carId);
    const car: CarData = existingCar ?? { carId, batteries: [] };
    const value = data.value;

    applyCarDataUpdate(car, path, value);

    if (!existingCar) {
        cars.push(car);
    }
}

const startCollector = () => {
  const rabbit = connectToRabbit();
  const rabbitPub = rabbit.createPublisher({
    confirm: true,
    maxAttempts: 2,
  });

  const mqttClient = createMqttClient();

  subscribeToMqttTopic(mqttClient, carTopics, handdleMqttTopic);

  setInterval(async () => {
      const carUpdates = cars.map(buildCarUpdate);

      logger.info('Sending car updates to rabbit', carUpdates.length);

      for (let i = 0; i < carUpdates.length; i += carUpdatesChunkSize) {
          const carUpdatesChunk = carUpdates.slice(i, i + carUpdatesChunkSize);
          await rabbitPub.send(carUpdatesQueue, carUpdatesChunk);
      }
  }, 5000);

  logger.info('Starting collector');
}

startCollector();