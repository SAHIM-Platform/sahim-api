import { Test, TestingModule } from '@nestjs/testing';
import { AdminManagementService } from './admin-management.service';

describe('AdminsService', () => {
  let service: AdminManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminManagementService],
    }).compile();

    service = module.get<AdminManagementService>(AdminManagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
