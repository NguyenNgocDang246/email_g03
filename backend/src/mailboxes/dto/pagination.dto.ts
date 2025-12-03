import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsString()
  @IsOptional()
  pageToken: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @IsOptional()
  limit: number;
}
