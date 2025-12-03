import { PrismaClient, UserRole, ContentType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data
  await prisma.webhookLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.content.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.aIPromptTemplate.deleteMany();
  await prisma.user.deleteMany();

  // Create Plans
  console.log('📦 Creating plans...');
  
  const freePlan = await prisma.plan.create({
    data: {
      name: 'FREE',
      displayName: 'Free Plan',
      description: 'Try our service with limited features',
      price: 0,
      monthlySeoCredits: 0,
      monthlyReelCredits: 0,
      features: JSON.stringify([
        'Sample AI Generation',
        'Limited Dashboard Access',
        'Basic Support'
      ]),
      sortOrder: 1,
    },
  });

  const basicPlan = await prisma.plan.create({
    data: {
      name: 'BASIC',
      displayName: 'Basic Plan',
      description: 'Perfect for individuals and small projects',
      price: 29.99,
      monthlySeoCredits: 50,
      monthlyReelCredits: 100,
      features: JSON.stringify([
        '50 SEO Articles per month',
        '100 Reel Scripts per month',
        'Full Dashboard Access',
        'Content Library',
        'Download & Copy',
        'Priority Support'
      ]),
      sortOrder: 2,
    },
  });

  const proPlan = await prisma.plan.create({
    data: {
      name: 'PRO',
      displayName: 'Pro Plan',
      description: 'For power users and businesses',
      price: 99.99,
      monthlySeoCredits: 200,
      monthlyReelCredits: 500,
      features: JSON.stringify([
        '200 SEO Articles per month',
        '500 Reel Scripts per month',
        'Full Dashboard Access',
        'Unlimited Content Library',
        'Advanced AI Settings',
        'Custom Templates',
        'API Access',
        'Premium Support'
      ]),
      sortOrder: 3,
    },
  });

  // Create Users
  console.log('👥 Creating users...');
  
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Admin User
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      seoCredits: 999999,
      reelCredits: 999999,
    },
  });

  // Try-out User
  const tryoutUser = await prisma.user.create({
    data: {
      email: 'tryout@example.com',
      password: hashedPassword,
      firstName: 'Try',
      lastName: 'Out',
      role: UserRole.TRYOUT,
      seoCredits: 3,
      reelCredits: 5,
      tryoutStartDate: new Date(),
      tryoutEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  // Free User
  const freeUser = await prisma.user.create({
    data: {
      email: 'free@example.com',
      password: hashedPassword,
      firstName: 'Free',
      lastName: 'User',
      role: UserRole.FREE,
      seoCredits: 0,
      reelCredits: 0,
    },
  });

  await prisma.subscription.create({
    data: {
      userId: freeUser.id,
      planType: UserRole.FREE,
      status: 'ACTIVE',
      monthlySeoCredits: 0,
      monthlyReelCredits: 0,
    },
  });

  // Basic User
  const basicUser = await prisma.user.create({
    data: {
      email: 'basic@example.com',
      password: hashedPassword,
      firstName: 'Basic',
      lastName: 'User',
      role: UserRole.BASIC,
      seoCredits: 50,
      reelCredits: 100,
    },
  });

  await prisma.subscription.create({
    data: {
      userId: basicUser.id,
      planType: UserRole.BASIC,
      status: 'ACTIVE',
      monthlySeoCredits: 50,
      monthlyReelCredits: 100,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  // Pro User
  const proUser = await prisma.user.create({
    data: {
      email: 'pro@example.com',
      password: hashedPassword,
      firstName: 'Pro',
      lastName: 'User',
      role: UserRole.PRO,
      seoCredits: 200,
      reelCredits: 500,
    },
  });

  await prisma.subscription.create({
    data: {
      userId: proUser.id,
      planType: UserRole.PRO,
      status: 'ACTIVE',
      monthlySeoCredits: 200,
      monthlyReelCredits: 500,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  // Create AI Prompt Templates
  console.log('🤖 Creating AI prompt templates...');
  
  await prisma.aIPromptTemplate.create({
    data: {
      type: ContentType.SEO_ARTICLE,
      name: 'SEO Article Generator',
      template: `You are an expert SEO content writer. Write a comprehensive, SEO-optimized article based on the following topic:

Topic: {{topic}}

Requirements:
- Length: 800-1200 words
- Include relevant keywords naturally
- Use H2 and H3 headings
- Write engaging introduction and conclusion
- Include actionable tips
- Optimize for readability

Please write the article in a professional yet conversational tone.`,
      isActive: true,
    },
  });

  await prisma.aIPromptTemplate.create({
    data: {
      type: ContentType.REEL_SCRIPT,
      name: 'Short Video/Reels Script Generator',
      template: `You are a viral content creator. Create an engaging short video/reel script based on:

Topic: {{topic}}

Requirements:
- Duration: 30-60 seconds
- Hook in first 3 seconds
- Clear value proposition
- Call-to-action at the end
- Include scene descriptions
- Add suggested text overlays

Format the script with:
[HOOK] - First 3 seconds
[MAIN CONTENT] - Core message
[CTA] - Call to action
[VISUAL NOTES] - Scene suggestions`,
      isActive: true,
    },
  });

  // Create Sample Content
  console.log('📝 Creating sample content...');
  
  await prisma.content.create({
    data: {
      userId: basicUser.id,
      type: ContentType.SEO_ARTICLE,
      title: '10 Tips for Better SEO in 2024',
      content: 'This is a sample SEO article content...',
      prompt: '10 tips for SEO',
    },
  });

  await prisma.content.create({
    data: {
      userId: proUser.id,
      type: ContentType.REEL_SCRIPT,
      title: 'How to Go Viral on Social Media',
      content: '[HOOK] Want to go viral? [MAIN CONTENT] Here are 3 secrets...',
      prompt: 'viral social media tips',
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('\n📋 Test Accounts:');
  console.log('Admin: admin@example.com / password123');
  console.log('Try-out: tryout@example.com / password123');
  console.log('Free: free@example.com / password123');
  console.log('Basic: basic@example.com / password123');
  console.log('Pro: pro@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

