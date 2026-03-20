import { logger } from './logger';

export interface CarData {
    carId: number;
    batteries: Array<{capacity?: number, soc?: number}>;
    latitude?: number;
    longitude?: number;
    gear?: number;
    speed?: number;
}

export const applyCarDataUpdate = (car: CarData, path: string[], value: unknown): void => {
    if (path[0] === "location" && path[1] === "latitude") {
        car.latitude = value as number;
    } else if (path[0] === "location" && path[1] === "longitude") {
        car.longitude = value as number;
    } else if (path[0] === "speed") {
        car.speed = value as number;
    } else if (path[0] === "gear") {
        car.gear = value === "N" ? 0 : value as number;
    } else if (path[0] === "battery" && path[2] === "soc") {
        const batteryIndex = Number(path[1]);
        const battery = car.batteries[batteryIndex] ?? {};

        battery.soc = value as number;
        car.batteries[batteryIndex] = battery;
    }  else if (path[0] === "battery" && path[2] === "capacity") {
        const batteryIndex = Number(path[1]);
        const battery = car.batteries[batteryIndex] ?? {};

        battery.capacity = value as number;
        car.batteries[batteryIndex] = battery;
    } else {
        logger.warn("Unknown car path", path)
    }
}

const expectedBatteryCount = 2;

export const computeSOC = (batteries: CarData["batteries"]): number | null => {
  if (
    batteries.length !== expectedBatteryCount || 
    batteries.some(x => x === undefined || x.capacity === undefined || x.soc === undefined)
  ) {
    return null;
  }

  const weightedSum = batteries.reduce((sum, battery) => {
    return sum + (battery.capacity ?? 0) * (battery.soc ?? 0);
  }, 0);
  const capacity = batteries.reduce((sum, battery) => {
    return sum + (battery.capacity ?? 0);
  }, 0);

  return (weightedSum / capacity);
}