import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create default priorities
  const priorities = await Promise.all([
    prisma.ticketPriority.upsert({ where: { name: 'Critical' }, update: {}, create: { name: 'Critical', color: '#ef4444', level: 4 } }),
    prisma.ticketPriority.upsert({ where: { name: 'High' }, update: {}, create: { name: 'High', color: '#f97316', level: 3 } }),
    prisma.ticketPriority.upsert({ where: { name: 'Medium' }, update: {}, create: { name: 'Medium', color: '#eab308', level: 2 } }),
    prisma.ticketPriority.upsert({ where: { name: 'Low' }, update: {}, create: { name: 'Low', color: '#22c55e', level: 1 } }),
  ])

  // Create users
  const adminPassword = await hash('admin123', 12)
  const managerPassword = await hash('manager123', 12)
  const member1Password = await hash('member123', 12)
  const member2Password = await hash('member123', 12)
  const member3Password = await hash('member123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: { email: 'admin@company.com', name: 'Alex Morgan', password: adminPassword, role: 'admin' }
  })

  const manager = await prisma.user.upsert({
    where: { email: 'sarah@company.com' },
    update: {},
    create: { email: 'sarah@company.com', name: 'Sarah Chen', password: managerPassword, role: 'manager' }
  })

  const member1 = await prisma.user.upsert({
    where: { email: 'john@company.com' },
    update: {},
    create: { email: 'john@company.com', name: 'John Rivera', password: member1Password, role: 'member' }
  })

  const member2 = await prisma.user.upsert({
    where: { email: 'emily@company.com' },
    update: {},
    create: { email: 'emily@company.com', name: 'Emily Nakamura', password: member2Password, role: 'member' }
  })

  const member3 = await prisma.user.upsert({
    where: { email: 'david@company.com' },
    update: {},
    create: { email: 'david@company.com', name: 'David Park', password: member3Password, role: 'member' }
  })

  // Create projects
  const project1 = await prisma.project.create({
    data: {
      name: 'Website Redesign',
      description: 'Complete redesign of the company website with modern UI/UX',
      prefix: 'WEB',
      color: '#8b5cf6',
      startDate: new Date('2026-01-15'),
      endDate: new Date('2026-06-30'),
      status: 'active',
      members: {
        create: [
          { userId: manager.id, role: 'manager' },
          { userId: member1.id, role: 'member' },
          { userId: member2.id, role: 'member' },
        ]
      },
      statuses: {
        create: [
          { name: 'Backlog', color: '#6b7280', sortOrder: 0, isCompleted: false },
          { name: 'To Do', color: '#3b82f6', sortOrder: 1, isCompleted: false },
          { name: 'In Progress', color: '#f59e0b', sortOrder: 2, isCompleted: false },
          { name: 'Review', color: '#8b5cf6', sortOrder: 3, isCompleted: false },
          { name: 'Done', color: '#22c55e', sortOrder: 4, isCompleted: true },
        ]
      },
    }
  })

  const project2 = await prisma.project.create({
    data: {
      name: 'Mobile App Development',
      description: 'Native mobile application for iOS and Android platforms',
      prefix: 'MOB',
      color: '#06b6d4',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-12-31'),
      status: 'active',
      members: {
        create: [
          { userId: manager.id, role: 'manager' },
          { userId: member3.id, role: 'member' },
        ]
      },
      statuses: {
        create: [
          { name: 'Backlog', color: '#6b7280', sortOrder: 0, isCompleted: false },
          { name: 'Sprint Planning', color: '#6366f1', sortOrder: 1, isCompleted: false },
          { name: 'In Development', color: '#f59e0b', sortOrder: 2, isCompleted: false },
          { name: 'Testing', color: '#ec4899', sortOrder: 3, isCompleted: false },
          { name: 'Deployed', color: '#22c55e', sortOrder: 4, isCompleted: true },
        ]
      },
    }
  })

  const project3 = await prisma.project.create({
    data: {
      name: 'API Integration',
      description: 'Third-party API integration for payment and notification services',
      prefix: 'API',
      color: '#f97316',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-05-31'),
      status: 'active',
      members: {
        create: [
          { userId: member1.id, role: 'manager' },
          { userId: member2.id, role: 'member' },
          { userId: member3.id, role: 'member' },
        ]
      },
      statuses: {
        create: [
          { name: 'Open', color: '#3b82f6', sortOrder: 0, isCompleted: false },
          { name: 'In Progress', color: '#f59e0b', sortOrder: 1, isCompleted: false },
          { name: 'Blocked', color: '#ef4444', sortOrder: 2, isCompleted: false },
          { name: 'Resolved', color: '#22c55e', sortOrder: 3, isCompleted: true },
        ]
      },
    }
  })

  // Create tickets for project 1
  const p1Statuses = await prisma.ticketStatus.findMany({ where: { projectId: project1.id }, orderBy: { sortOrder: 'asc' } })
  const p2Statuses = await prisma.ticketStatus.findMany({ where: { projectId: project2.id }, orderBy: { sortOrder: 'asc' } })
  const p3Statuses = await prisma.ticketStatus.findMany({ where: { projectId: project3.id }, orderBy: { sortOrder: 'asc' } })

  await prisma.ticket.create({
    data: {
      title: 'Design new homepage layout',
      description: 'Create wireframes and high-fidelity mockups for the new homepage. Include responsive designs for mobile, tablet, and desktop.',
      projectId: project1.id,
      statusId: p1Statuses[3]?.id || p1Statuses[0].id,
      priorityId: priorities[1].id,
      createdById: manager.id,
      startDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-15'),
      assignees: { create: [{ userId: member1.id }] }
    }
  })

  await prisma.ticket.create({
    data: {
      title: 'Implement user authentication flow',
      description: 'Build login, registration, and password reset pages with proper validation and error handling.',
      projectId: project1.id,
      statusId: p1Statuses[2]?.id || p1Statuses[0].id,
      priorityId: priorities[0].id,
      createdById: manager.id,
      startDate: new Date('2026-02-10'),
      dueDate: new Date('2026-03-01'),
      assignees: { create: [{ userId: member2.id }] }
    }
  })

  await prisma.ticket.create({
    data: {
      title: 'Set up CI/CD pipeline',
      description: 'Configure GitHub Actions for automated testing and deployment to staging and production environments.',
      projectId: project1.id,
      statusId: p1Statuses[4]?.id || p1Statuses[0].id,
      priorityId: priorities[2].id,
      createdById: member1.id,
      startDate: new Date('2026-01-20'),
      dueDate: new Date('2026-02-05'),
      assignees: { create: [{ userId: member1.id }] }
    }
  })

  await prisma.ticket.create({
    data: {
      title: 'Create contact page',
      description: 'Design and implement the contact page with form validation and email integration.',
      projectId: project1.id,
      statusId: p1Statuses[1]?.id || p1Statuses[0].id,
      priorityId: priorities[2].id,
      createdById: manager.id,
      dueDate: new Date('2026-03-15'),
      assignees: { create: [{ userId: member2.id }] }
    }
  })

  await prisma.ticket.create({
    data: {
      title: 'Optimize images and assets',
      description: 'Compress and optimize all images, implement lazy loading, and set up CDN for static assets.',
      projectId: project1.id,
      statusId: p1Statuses[0]?.id,
      priorityId: priorities[3].id,
      createdById: admin.id,
      dueDate: new Date('2026-04-01'),
    }
  })

  // Tickets for project 2
  await prisma.ticket.create({
    data: {
      title: 'Set up React Native project',
      description: 'Initialize React Native project with TypeScript, configure navigation, and set up the project structure.',
      projectId: project2.id,
      statusId: p2Statuses[4]?.id || p2Statuses[0].id,
      priorityId: priorities[0].id,
      createdById: manager.id,
      startDate: new Date('2026-03-01'),
      dueDate: new Date('2026-03-10'),
      assignees: { create: [{ userId: member3.id }] }
    }
  })

  await prisma.ticket.create({
    data: {
      title: 'Build user profile screen',
      description: 'Create the user profile screen with avatar upload, name editing, and notification preferences.',
      projectId: project2.id,
      statusId: p2Statuses[2]?.id || p2Statuses[0].id,
      priorityId: priorities[1].id,
      createdById: manager.id,
      dueDate: new Date('2026-04-15'),
      assignees: { create: [{ userId: member3.id }] }
    }
  })

  await prisma.ticket.create({
    data: {
      title: 'Implement push notifications',
      description: 'Integrate Firebase Cloud Messaging for push notifications on both iOS and Android.',
      projectId: project2.id,
      statusId: p2Statuses[1]?.id || p2Statuses[0].id,
      priorityId: priorities[2].id,
      createdById: admin.id,
      dueDate: new Date('2026-05-01'),
    }
  })

  // Tickets for project 3
  await prisma.ticket.create({
    data: {
      title: 'Integrate Stripe payment gateway',
      description: 'Set up Stripe for processing payments including subscription management and invoice generation.',
      projectId: project3.id,
      statusId: p3Statuses[1]?.id || p3Statuses[0].id,
      priorityId: priorities[0].id,
      createdById: member1.id,
      startDate: new Date('2026-02-15'),
      dueDate: new Date('2026-03-31'),
      assignees: { create: [{ userId: member2.id }, { userId: member3.id }] }
    }
  })

  await prisma.ticket.create({
    data: {
      title: 'Set up email notification service',
      description: 'Configure SendGrid or similar service for transactional emails and notifications.',
      projectId: project3.id,
      statusId: p3Statuses[0]?.id,
      priorityId: priorities[1].id,
      createdById: member1.id,
      dueDate: new Date('2026-04-15'),
    }
  })

  await prisma.ticket.create({
    data: {
      title: 'API rate limiting and caching',
      description: 'Implement rate limiting for API endpoints and set up Redis caching for frequently accessed data.',
      projectId: project3.id,
      statusId: p3Statuses[2]?.id || p3Statuses[0].id,
      priorityId: priorities[1].id,
      createdById: admin.id,
      dueDate: new Date('2026-04-30'),
      assignees: { create: [{ userId: member3.id }] }
    }
  })

  console.log('Database seeded successfully!')
  console.log('---')
  console.log('Login credentials:')
  console.log('  Admin:   admin@company.com / admin123')
  console.log('  Manager: sarah@company.com / manager123')
  console.log('  Member:  john@company.com / member123')
  console.log('           emily@company.com / member123')
  console.log('           david@company.com / member123')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
