import { CarStateUpdate, prisma } from './db';
import { logger } from './logger';
import { carUpdatesQueue, connectToRabbit } from './rabbit';

const createNewCarStates = async (carStateUpdates: CarStateUpdate[]) => {
    logger.info('saving car state updates', carStateUpdates);
    await prisma.car_state.createMany({
        data: carStateUpdates,
    })
}

const rabbit = connectToRabbit();
const rabbitSub = rabbit.createConsumer({
    queue: carUpdatesQueue,
    queueOptions: { durable: true },
    qos: { prefetchCount: 2 },
}, async (message) => {
    const carUpdates = message.body as CarStateUpdate[];
    await createNewCarStates(carUpdates);
});

rabbitSub.on('error', (err) => {
  logger.error('consumer error', carUpdatesQueue, err)
});
