import {
  Delete,
  HttpCode,
  HttpStatus,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CitiesService } from './cities.service';
import { CityShort } from './cities.types';
import { AccessTokenGuard } from 'src/auth/guards/accessToken.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/shared/enums/role.enum';
import { UpdateCityDto } from './dto/update-city.dto';
import { CreateCityDto } from './dto/create-city.dto';
import { City } from './entities/city.entity';
import {
  ApiCitiesCreate,
  ApiCitiesFindAll,
  ApiCitiesRemove,
  ApiCitiesUpdate,
} from './cities.swagger';

@ApiTags('cities')
@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get()
  @ApiCitiesFindAll()
  async findAll(
    @Query('search') search?: string,
    @Query('major') major?: string,
  ): Promise<CityShort[]> {
    return this.citiesService.search({
      search,
      major: major === 'true',
    });
  }

  @Delete(':id')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles([Role.ADMIN])
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCitiesRemove()
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.citiesService.remove(id);
  }

  @Patch(':id')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles([Role.ADMIN])
  @ApiCitiesUpdate()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCityDto,
  ): Promise<City> {
    return this.citiesService.update(id, dto);
  }

  @Post()
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles([Role.ADMIN])
  @ApiCitiesCreate()
  create(@Body() dto: CreateCityDto): Promise<City> {
    return this.citiesService.create(dto);
  }
}
