import { logger } from './logger';
import { CarStateUpdate } from './db';
import { applyCarDataUpdate, CarData, computeSOC } from './car-data';
import { carUpdatesQueue, rabbit } from './rabbit';
import { mqttClient } from './mqtt';

const cars: Array<CarData> = [];

mqttClient.on('connect', () => {
  mqttClient.subscribe(["car/#"], () => {
     logger.info('Subscribed to car topics');
  });
});

mqttClient.on('message', (topic, payload) => {
  const data = JSON.parse(payload.toString());
  const [entity, entityId, ...path] = topic.split('/');

  if (entity !== "car" || !data) return;

  const carId = Number(entityId);
  const existingCar = cars.find(x => x.carId === carId);
  const car: CarData = existingCar ?? { carId, batteries: [] };
  const value = data.value;

  applyCarDataUpdate(car, path, value);

  if (!existingCar) {
    cars.push(car);
  }
});

const rabbitPub = rabbit.createPublisher({
  confirm: true,
  maxAttempts: 2,
});

setInterval(async () => {
    const carUpdates = cars.map((car): CarStateUpdate => ({
      car_id: car.carId,
      time: new Date(),
      speed: car.speed ?? null,
      gear: car.gear ?? null,
      latitude: car.latitude ?? null,
      longitude: car.longitude ?? null,
      state_of_charge: computeSOC(car.batteries),
    }));

    logger.info("Sending car updates to rabbit", carUpdates.length);

    for(const carUpdate of carUpdates) {
      await rabbitPub.send(carUpdatesQueue, carUpdate);
    }
}, 5000);
