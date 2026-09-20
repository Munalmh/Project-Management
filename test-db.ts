import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.count();
  const projects = await prisma.project.count();
  const tickets = await prisma.ticket.count();
  
  console.log('Users:', users);
  console.log('Projects:', projects);
  console.log('Tickets:', tickets);

  const allUsers = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
  console.log('All users:', allUsers);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
