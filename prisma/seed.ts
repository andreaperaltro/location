import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: 'test@locationmanager.app' },
    update: {},
    create: {
      email: 'test@locationmanager.app',
      name: 'Test User',
      emailVerified: new Date(),
    },
  });

  console.log('✅ Created test user:', user.email);

  // Create a test client
  const client = await prisma.client.upsert({
    where: { id: 'test-client' },
    update: {},
    create: {
      id: 'test-client',
      userId: user.id,
      name: 'Sample Client',
      email: 'client@example.com',
      phone: '+1 (555) 123-4567',
      address: '123 Main St, City, State 12345',
      notes: 'This is a sample client for testing purposes.',
    },
  });

  console.log('✅ Created test client:', client.name);

  // Create a test project
  const project = await prisma.project.upsert({
    where: { id: 'test-project' },
    update: {},
    create: {
      id: 'test-project',
      userId: user.id,
      clientId: client.id,
      title: 'Sample Project',
      description: 'This is a sample project for testing the location manager.',
      status: 'ACTIVE',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      budget: 50000.00,
      notes: 'This is a test project with sample locations.',
    },
  });

  console.log('✅ Created test project:', project.title);

  // Create sample locations
  const locations = await Promise.all([
    prisma.location.upsert({
      where: { id: 'test-location-1' },
      update: {},
      create: {
        id: 'test-location-1',
        userId: user.id,
        projectId: project.id,
        title: 'Downtown Plaza',
        address: '100 Main Street, Downtown, CA 90210',
        lat: 34.0522,
        lng: -118.2437,
        timezone: 'America/Los_Angeles',
        notes: 'A bustling downtown plaza with great photo opportunities.',
        tags: ['urban', 'downtown', 'plaza', 'photography'],
      },
    }),
    prisma.location.upsert({
      where: { id: 'test-location-2' },
      update: {},
      create: {
        id: 'test-location-2',
        userId: user.id,
        projectId: project.id,
        title: 'Beach Sunset Point',
        address: 'Beach Road, Malibu, CA 90265',
        lat: 34.0259,
        lng: -118.7798,
        timezone: 'America/Los_Angeles',
        notes: 'Perfect spot for sunset photography with ocean views.',
        tags: ['beach', 'sunset', 'ocean', 'nature'],
      },
    }),
    prisma.location.upsert({
      where: { id: 'test-location-3' },
      update: {},
      create: {
        id: 'test-location-3',
        userId: user.id,
        projectId: project.id,
        title: 'Mountain Vista',
        address: 'Mountain Trail, Big Bear, CA 92315',
        lat: 34.2439,
        lng: -116.9114,
        timezone: 'America/Los_Angeles',
        notes: 'High altitude location with panoramic mountain views.',
        tags: ['mountain', 'vista', 'hiking', 'panoramic'],
      },
    }),
  ]);

  console.log('✅ Created test locations:', locations.map(l => l.title));

  // Create sample sun times for the first location
  const sunTimes = await Promise.all([
    prisma.sunTime.upsert({
      where: { 
        locationId_date: {
          locationId: locations[0].id,
          date: new Date('2024-01-15')
        }
      },
      update: {},
      create: {
        locationId: locations[0].id,
        date: new Date('2024-01-15'),
        sunrise: new Date('1970-01-01T06:45:00'),
        sunset: new Date('1970-01-01T17:30:00'),
        goldenStart: new Date('1970-01-01T06:15:00'),
        goldenEnd: new Date('1970-01-01T07:15:00'),
      },
    }),
    prisma.sunTime.upsert({
      where: { 
        locationId_date: {
          locationId: locations[0].id,
          date: new Date('2024-06-15')
        }
      },
      update: {},
      create: {
        locationId: locations[0].id,
        date: new Date('2024-06-15'),
        sunrise: new Date('1970-01-01T05:30:00'),
        sunset: new Date('1970-01-01T20:00:00'),
        goldenStart: new Date('1970-01-01T05:00:00'),
        goldenEnd: new Date('1970-01-01T06:00:00'),
      },
    }),
  ]);

  console.log('✅ Created sample sun times');

  // Create a sample proposal
  const proposal = await prisma.proposal.upsert({
    where: { id: 'test-proposal' },
    update: {},
    create: {
      id: 'test-proposal',
      userId: user.id,
      projectId: project.id,
      title: 'Sample Photography Proposal',
      introMd: '# Welcome to Our Photography Proposal\n\nThis is a sample proposal showcasing our location photography services.',
      outroMd: '## Thank You\n\nWe look forward to working with you on this project.',
      status: 'DRAFT',
      slug: 'sample-photography-proposal',
    },
  });

  console.log('✅ Created test proposal:', proposal.title);

  // Create proposal items
  const proposalItems = await Promise.all([
    prisma.proposalItem.create({
      data: {
        proposalId: proposal.id,
        locationId: locations[0].id,
        order: 0,
      },
    }),
    prisma.proposalItem.create({
      data: {
        proposalId: proposal.id,
        locationId: locations[1].id,
        order: 1,
      },
    }),
  ]);

  console.log('✅ Created proposal items');

  // Create a sample share link
  const shareLink = await prisma.shareLink.create({
    data: {
      proposalId: proposal.id,
      token: 'sample-share-token-123',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isActive: true,
    },
  });

  console.log('✅ Created share link');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`- 1 user: ${user.email}`);
  console.log(`- 1 client: ${client.name}`);
  console.log(`- 1 project: ${project.title}`);
  console.log(`- ${locations.length} locations`);
  console.log(`- ${sunTimes.length} sun times`);
  console.log(`- 1 proposal: ${proposal.title}`);
  console.log(`- ${proposalItems.length} proposal items`);
  console.log(`- 1 share link`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
