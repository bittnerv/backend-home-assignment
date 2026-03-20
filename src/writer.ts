import { CarStateUpdate, prisma } from './db';
import { logger } from './logger';
import { carUpdatesQueue, rabbit } from './rabbit';

const createNewCarState = async (carStateUpdate: CarStateUpdate) => {
    const lastCarState = await prisma.car_state.findFirst({
        where: { car_id: carStateUpdate.car_id },
        orderBy: { time: "desc" }
    });

    logger.info("saving car state update", carStateUpdate);

    await prisma.car_state.create({
        data: {
            car_id: carStateUpdate.car_id,
            time: carStateUpdate.time,
            state_of_charge: carStateUpdate.state_of_charge ?? lastCarState?.state_of_charge,
            latitude: carStateUpdate.latitude ?? lastCarState?.latitude,
            longitude: carStateUpdate.longitude ?? lastCarState?.longitude,
            gear: carStateUpdate.gear ?? lastCarState?.gear,
            speed: carStateUpdate.speed ?? lastCarState?.speed,
        }
    })
}

const rabbitSub = rabbit.createConsumer({
    queue: carUpdatesQueue,
    queueOptions: {durable: true},
    qos: { prefetchCount: 2 },
}, async (message) => {
    const carState = message.body as CarStateUpdate;
    await createNewCarState(carState);
});

rabbitSub.on('error', (err) => {
  logger.error('consumer error', carUpdatesQueue, err)
});
