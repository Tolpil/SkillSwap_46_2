import { AppDataSource } from '../config/db.config';
import { City } from '../cities/entities/city.entity';
import { Repository } from 'typeorm';
import { seedCitiesData } from './data/seed-cities.data';
import { seedMajorCitiesData } from './data/seed-major-cities.data';

const getCityKey = (name: string, region: string) => `${name}|||${region}`;

async function seedCities() {
  await AppDataSource.initialize();

  const cityRepository = AppDataSource.getRepository(City);

  const existingCities = await cityRepository.find({
    select: ['name', 'region'],
  });

  const existingCityKeys = new Set(
    existingCities.map((city) => getCityKey(city.name, city.region)),
  );

  const citiesToCreate = seedCitiesData
    .filter(
      (cityData) =>
        !existingCityKeys.has(getCityKey(cityData.name, cityData.region)),
    )
    .map((cityData) => cityRepository.create(cityData));

  if (citiesToCreate.length > 0) {
    await cityRepository.save(citiesToCreate);
  }

  console.log(
    `Seeded ${citiesToCreate.length} cities (${seedCitiesData.length} cities in dataset)`,
  );

  await markMajorCities(cityRepository);
}

async function markMajorCities(
  cityRepository: Repository<City>,
): Promise<void> {
  let updatedCount = 0;
  let notFoundCount = 0;

  for (const { name, region, sortOrder } of seedMajorCitiesData) {
    const city = await cityRepository.findOne({ where: { name, region } });

    if (!city) {
      console.warn(
        `[mark-major-cities] Город "${name}" (${region}) не найден — пропущен`,
      );
      notFoundCount += 1;
      continue;
    }

    if (city.sortOrder !== sortOrder) {
      city.sortOrder = sortOrder;
      await cityRepository.save(city);
      updatedCount += 1;
    }
  }

  console.log(
    `[mark-major-cities] Обновлено: ${updatedCount}, не найдено: ${notFoundCount}, всего в списке: ${seedMajorCitiesData.length}`,
  );
}

seedCities()
  .catch((error) => {
    console.error('Error seeding cities:', error);
  })
  .finally(() => {
    if (AppDataSource.isInitialized) {
      void AppDataSource.destroy();
    }
  });
