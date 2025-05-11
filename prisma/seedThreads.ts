import { Department, PrismaClient, UserRole, ApprovalStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
    // Create test users with different approval statuses
    const testUsers = [
        // Approved Students
        {
            username: 'approved1',
            password: 'password123',
            name: 'Approved Student 1',
            role: UserRole.STUDENT,
            photoPath: '/public/avatars/defaults/user.webp',
            student: {
                academicNumber: "1234567890123",
                department: Department.IT,
                studyLevel: 4,
                approvalStatus: ApprovalStatus.APPROVED
            }
        },
        {
            username: 'approved2',
            password: 'password123',
            name: 'Approved Student 2',
            role: UserRole.STUDENT,
            photoPath: '/public/avatars/defaults/user.webp',
            student: {
                academicNumber: "1234567890124",
                department: Department.SE,
                studyLevel: 3,
                approvalStatus: ApprovalStatus.APPROVED
            }
        },
        // Pending Students
        {
            username: 'pending1',
            password: 'password123',
            name: 'Pending Student 1',
            role: UserRole.STUDENT,
            photoPath: '/public/avatars/defaults/user.webp',
            student: {
                academicNumber: "1234567890125",
                department: Department.COM,
                studyLevel: 2,
                approvalStatus: ApprovalStatus.PENDING
            }
        },
        {
            username: 'pending2',
            password: 'password123',
            name: 'Pending Student 2',
            role: UserRole.STUDENT,
            photoPath: '/public/avatars/defaults/user.webp',
            student: {
                academicNumber: "1234567890126",
                department: Department.IMSE,
                studyLevel: 1,
                approvalStatus: ApprovalStatus.PENDING
            }
        },
        // Rejected Students
        {
            username: 'rejected1',
            password: 'password123',
            name: 'Rejected Student 1',
            role: UserRole.STUDENT,
            photoPath: '/public/avatars/defaults/user.webp',
            student: {
                academicNumber: "1234567890127",
                department: Department.CND,
                studyLevel: 5,
                approvalStatus: ApprovalStatus.REJECTED
            }
        },
        {
            username: 'rejected2',
            password: 'password123',
            name: 'Rejected Student 2',
            role: UserRole.STUDENT,
            photoPath: '/public/avatars/defaults/user.webp',
            student: {
                academicNumber: "1234567890128",
                department: Department.MRE,
                studyLevel: 4,
                approvalStatus: ApprovalStatus.REJECTED
            }
        }
    ];

    // Create or update test users
    for (const userData of testUsers) {
        const existingUser = await prisma.user.findFirst({
            where: { username: userData.username }
        });

        if (!existingUser) {
            await prisma.user.create({
                data: {
                    ...userData,
                    password: await bcrypt.hash(userData.password, 10),
                    student: {
                        create: userData.student
                    }
                }
            });
        }
    }

    // Get the first approved user for creating threads
    const approvedUser = await prisma.user.findFirst({
        where: { username: 'approved1' }
    });

    if (!approvedUser) {
        throw new Error('Approved test user not found');
    }

    let category = await prisma.category.findFirst({
        where: { name: 'عام' },
    });

    if (!category) {
        category = await prisma.category.create({
            data: {
                name: 'عام',
            },
        });
    }

    const threads = [
        {
            title: 'كيف أتعلم البرمجة من الصفر؟',
            content: 'أريد أن أبدأ بتعلم البرمجة، هل تنصحوني بلغة معينة؟',
        },
        {
            title: 'مشكلة في كود JavaScript',
            content: 'واجهتني مشكلة في الكود التالي: let x = ...',
        },
        {
            title: 'اقتراحات لمشاريع تخرج',
            content: 'أبحث عن أفكار مميزة لمشروع تخرج متعلق بالذكاء الاصطناعي.',
        },
        {
            title: 'أفضل مصادر لتعلم React',
            content: 'ما هي أفضل القنوات والدورات لتعلم React JS؟',
        },
        {
            title: 'مشكلة في تثبيت بيئة Laravel',
            content: 'حاولت تثبيت Laravel ولكن ظهرت لي رسالة خطأ، هل من مساعدة؟',
        },
    ];

    for (const thread of threads) {
        await prisma.thread.create({
            data: {
                title: thread.title,
                content: thread.content,
                author_user_id: approvedUser.id,
                category_id: category.category_id,
            },
        });
    }

    console.log('Data has been successfully inserted.');
}

seed()
    .catch((e) => {
        console.error(e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });