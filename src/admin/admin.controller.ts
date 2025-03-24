import { Roles } from '@/auth/decorators/role.decorator';
import { Body, Controller, Post, Res} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AdminService } from './admin.service';
import { AdminSignupDto } from './dto/create-admin.dto';

@Controller('admin')
@Roles(UserRole.ADMIN)
export class AdminController {
    constructor (private readonly adminService: AdminService) {}

    @Post()
    @Roles(UserRole.SUPER_ADMIN)
    async createAdmin(@Body() dto: AdminSignupDto, @Res() res) {
        return await this.adminService.createAdmin(dto, res);
    }

}
