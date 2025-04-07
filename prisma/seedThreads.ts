import { PrismaClient, UserRole, Department } from '@prisma/client';
import * as bcrypt from 'bcryptjs';


const prisma = new PrismaClient();

async function seed() {

    let user = await prisma.user.findFirst({
        where: { email: 'test@example.com' },
    });

    if (!user) {
        user = await prisma.user.create({
            data: {
                email: 'test@example.com',
                username: 'testuser',
                password: await bcrypt.hash('password123', 10),
                name: 'Test User',
                role: UserRole.STUDENT,
                student: {
                    create: {
                        academicNumber: "123457",
                        department: Department.IT,
                        studyLevel: 4,
                    },
                },
            },
        });
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
                author_user_id: user.id,
                category_id: category.category_id,
            },
        });
    }

    console.log(' البيانات أُدخلت بنجاح.');
}

seed()
    .catch((e) => {
        console.error(e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });