import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { InventoryEntriesDto } from './inventory_entries.dto';

export class BulkInventoryEntryDto {
  @ValidateNested({ each: true })
  @Type(() => InventoryEntriesDto)
  entries: InventoryEntriesDto[];
  type: string
}
