import { IsNumber, IsOptional, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @IsOptional()
  page: number = 1;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @IsOptional()
  limit: number = 10;
}
