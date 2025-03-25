import { AuthResponse } from '@/auth/interfaces/jwt-payload.interface';
import { BadRequestException, ForbiddenException, Injectable, OnModuleInit, Res } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AdminSignupDto } from './dto/create-admin.dto';
import { UsersService } from '@/users/users.service';
import { PrismaService } from 'prisma/prisma.service';
import { AuthUtil } from '@/auth/utils/auth.util';
import { SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, SUPER_ADMIN_USERNAME } from './utils/constans';

@Injectable()
export class AdminService implements OnModuleInit {

    constructor (
        private readonly usersService: UsersService,
        private readonly prisma: PrismaService,
        private readonly authUtil: AuthUtil
    ) {}

    async onModuleInit() {
      await this.ensureSuperAdminExists();
      console.log('Inside init');
    }

    private async ensureSuperAdminExists() {
      if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_USERNAME || !SUPER_ADMIN_PASSWORD) {
        console.warn('Super Admin credentials are missing in .env file');
        return;
      }
  
      const existingSuperAdmin = await this.usersService.findUserByEmailOrUsername(SUPER_ADMIN_EMAIL, SUPER_ADMIN_USERNAME);
  
      if (!existingSuperAdmin) {
        const hashedPassword = await this.authUtil.hashPassword(SUPER_ADMIN_USERNAME);
  
        await this.prisma.user.create({
          data: {
            email: SUPER_ADMIN_EMAIL,
            username: SUPER_ADMIN_USERNAME,
            name: 'Super Admin',
            password: hashedPassword,
            role: UserRole.SUPER_ADMIN, 
          },
        });
  
        console.log('Default Super Admin created successfully');
      }
      
    }

    async createAdmin(input: AdminSignupDto, @Res() res) {
        const { email, name, username, password } = input;
      
        const existingUser = await this.usersService.findUserByEmailOrUsername(email, username);
        if (existingUser) {
          throw new BadRequestException('Admin with this email or username already exists');
        }
      
        const hashedPassword = await this.authUtil.hashPassword(password);
      
        const createdAdmin = await this.prisma.user.create({
          data: {
            ...input,
            password: hashedPassword,
            role: UserRole.ADMIN
          },
        });
            
        return { message: "Admin created successfully" };
      }
      
      async deleteAdmin(adminId: number, requesterId: number, requesterRole: UserRole) {
        const admin = await this.usersService.findUserById(adminId);

        if (!admin) {
          throw new BadRequestException('Admin not found');
        }

        if (admin.role === UserRole.SUPER_ADMIN) {
          throw new BadRequestException("Super admin cannot be deleted");
        }
        
        if (requesterRole === UserRole.ADMIN && requesterId!=adminId) {
          throw new ForbiddenException('You are not allowed to delete other admins');
        }
        
        await this.prisma.user.delete({ where: { id: adminId }});

        return { message: "Admin deleted successfully"};
      }
      
}
