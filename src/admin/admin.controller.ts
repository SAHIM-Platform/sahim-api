import { Roles } from '@/auth/decorators/role.decorator';
import { Body, Controller, Delete, Param, ParseIntPipe, Post, Req, Res} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AdminService } from './admin.service';
import { AdminSignupDto } from './dto/create-admin.dto';

@Controller('admin')
export class AdminController {
    constructor (private readonly adminService: AdminService) {}

    @Post()
    @Roles(UserRole.SUPER_ADMIN)
    async createAdmin(@Body() dto: AdminSignupDto, @Res() res) {
        return await this.adminService.createAdmin(dto, res);
    }

    @Delete(':id')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    async deleteAdmin(@Req() req, @Param('id', ParseIntPipe) adminId: number) {
        const requesterId = req.user?.sub;
        const requesterRole = req.user?.role;
        return await this.adminService.deleteAdmin(adminId, requesterId, requesterRole);
    }
}
