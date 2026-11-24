import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Starting database seeding for Powertech ERP...');

  // 1. Define Module Names
  const modules = [
    'ENQUIRY',
    'QUOTATION',
    'ORDER',
    'DISPATCH',
    'BILLING',
    'PURCHASE',
    'DAILY_SUMMARY',
    'REPORT',
    'USER_ROLE',
    'SETTING',
  ];

  // 2. Create Roles
  const rolesData = [
    {
      name: 'Super Admin',
      description: 'Unrestricted access to all modules, records, user management, and system configuration.',
      isSystem: true,
      permissions: modules.map((m) => ({
        module: m,
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canExport: true,
        dataScope: 'ALL',
      })),
    },
    {
      name: 'Sales',
      description: 'Manages customer enquiries, quotes, pricing, and converts orders.',
      isSystem: false,
      permissions: [
        { module: 'ENQUIRY', canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: true, dataScope: 'ALL' },
        { module: 'QUOTATION', canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: true, dataScope: 'ALL' },
        { module: 'ORDER', canView: true, canCreate: true, canEdit: false, canDelete: false, canExport: true, dataScope: 'ALL' },
        { module: 'DISPATCH', canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'ALL' },
        { module: 'BILLING', canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'ALL' },
        { module: 'PURCHASE', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
        { module: 'DAILY_SUMMARY', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
        { module: 'REPORT', canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: true, dataScope: 'ALL' },
        { module: 'USER_ROLE', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
        { module: 'SETTING', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
      ],
    },
    {
      name: 'Operations/Dispatch',
      description: 'Coordinates order fulfillment, tracking, partial dispatches, and delivery proofs.',
      isSystem: false,
      permissions: [
        { module: 'ENQUIRY', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
        { module: 'QUOTATION', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
        { module: 'ORDER', canView: true, canCreate: false, canEdit: true, canDelete: false, canExport: true, dataScope: 'ALL' },
        { module: 'DISPATCH', canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: true, dataScope: 'ALL' },
        { module: 'BILLING', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
        { module: 'PURCHASE', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
        { module: 'DAILY_SUMMARY', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
        { module: 'REPORT', canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: true, dataScope: 'ALL' },
        { module: 'USER_ROLE', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
        { module: 'SETTING', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
      ],
    },
    {
      name: 'Accounts',
      description: 'Generates invoices, records receipts, tracks outstanding ageing, and reviews daily collections.',
      isSystem: false,
      permissions: [
        { module: 'ENQUIRY', canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'ALL' },
        { module: 'QUOTATION', canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'ALL' },
        { module: 'ORDER', canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: true, dataScope: 'ALL' },
        { module: 'DISPATCH', canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'ALL' },
        { module: 'BILLING', canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: true, dataScope: 'ALL' },
        { module: 'PURCHASE', canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: true, dataScope: 'ALL' },
        { module: 'DAILY_SUMMARY', canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: true, dataScope: 'ALL' },
        { module: 'REPORT', canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: true, dataScope: 'ALL' },
        { module: 'USER_ROLE', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
        { module: 'SETTING', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
      ],
    },
    {
      name: 'Purchase',
      description: 'Manages suppliers, procurement entries, and supplier bills.',
      isSystem: false,
      permissions: [
        { module: 'ENQUIRY', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
        { module: 'QUOTATION', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
        { module: 'ORDER', canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'ALL' },
        { module: 'DISPATCH', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
        { module: 'BILLING', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
        { module: 'PURCHASE', canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: true, dataScope: 'ALL' },
        { module: 'DAILY_SUMMARY', canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'ALL' },
        { module: 'REPORT', canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: true, dataScope: 'ALL' },
        { module: 'USER_ROLE', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
        { module: 'SETTING', canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, dataScope: 'OWN' },
      ],
    },
  ];

  const createdRoles: Record<string, any> = {};

  for (const roleDef of rolesData) {
    let role = await prisma.role.findUnique({ where: { name: roleDef.name } });
    if (!role) {
      role = await prisma.role.create({
        data: {
          name: roleDef.name,
          description: roleDef.description,
          isSystem: roleDef.isSystem,
        },
      });
    }
    createdRoles[roleDef.name] = role;

    // Permissions
    for (const perm of roleDef.permissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_module: {
            roleId: role.id,
            module: perm.module,
          },
        },
        update: {
          canView: perm.canView,
          canCreate: perm.canCreate,
          canEdit: perm.canEdit,
          canDelete: perm.canDelete,
          canExport: perm.canExport,
          dataScope: perm.dataScope,
        },
        create: {
          roleId: role.id,
          module: perm.module,
          canView: perm.canView,
          canCreate: perm.canCreate,
          canEdit: perm.canEdit,
          canDelete: perm.canDelete,
          canExport: perm.canExport,
          dataScope: perm.dataScope,
        },
      });
    }
  }

  // 3. Create Seed Users (one per role)
  const defaultPassword = await bcrypt.hash('Password@123', 10);
  const usersData = [
    { email: 'admin@powertech.com', name: 'Super Admin User', role: 'Super Admin', phone: '+91 98000 00001' },
    { email: 'sales@powertech.com', name: 'Siddharth Sales', role: 'Sales', phone: '+91 98000 00002' },
    { email: 'operations@powertech.com', name: 'Omkar Operations', role: 'Operations/Dispatch', phone: '+91 98000 00003' },
    { email: 'accounts@powertech.com', name: 'Ananya Accounts', role: 'Accounts', phone: '+91 98000 00004' },
    { email: 'purchase@powertech.com', name: 'Prakash Purchase', role: 'Purchase', phone: '+91 98000 00005' },
  ];

  const createdUsers: Record<string, any> = {};

  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        phone: u.phone,
        roleId: createdRoles[u.role].id,
      },
      create: {
        email: u.email,
        name: u.name,
        phone: u.phone,
        passwordHash: defaultPassword,
        roleId: createdRoles[u.role].id,
      },
    });
    createdUsers[u.email] = user;
  }

  // 4. Seed Settings
  const settingsData = [
    { key: 'COMPANY_NAME', value: 'Powertech Industrial Solutions Pvt. Ltd.', category: 'GENERAL', description: 'Registered legal company name' },
    { key: 'COMPANY_ADDRESS', value: 'Plot 18, Electronic Sadan, Bhosari MIDC, Pune, Maharashtra 411026', category: 'GENERAL', description: 'Official corporate address' },
    { key: 'COMPANY_PHONE', value: '+91 20 2740 5500', category: 'GENERAL', description: 'Primary office contact number' },
    { key: 'COMPANY_EMAIL', value: 'contact@powertech.com', category: 'GENERAL', description: 'Official support and enquiry email' },
    { key: 'COMPANY_GSTIN', value: '27AABCP9999K1Z5', category: 'TAX', description: 'Company GSTIN registration number' },
    { key: 'BANK_NAME', value: 'HDFC Bank Ltd.', category: 'INVOICE', description: 'Bank name for remittance' },
    { key: 'BANK_ACCOUNT_NO', value: '50200012345678', category: 'INVOICE', description: 'Current bank account number' },
    { key: 'BANK_IFSC', value: 'HDFC0001234', category: 'INVOICE', description: 'NEFT/RTGS IFSC code' },
    { key: 'BANK_BRANCH', value: 'Pimpri-Chinchwad Branch, Pune', category: 'INVOICE', description: 'Bank branch name' },
    { key: 'DEFAULT_TAX_RATE', value: '18', category: 'TAX', description: 'Default GST rate percentage' },
    { key: 'ENABLE_GST_FIELDS', value: 'true', category: 'TAX', description: 'Enable detailed GST fields like HSN and split CGST/SGST/IGST' },
    { key: 'INVOICE_MODE_DEFAULT', value: 'SYSTEM_GENERATED', category: 'INVOICE', description: 'Default mode: SYSTEM_GENERATED or RECORDED_EXTERNAL' },
    { key: 'ENABLE_EXPORTS', value: 'true', category: 'GENERAL', description: 'Global toggle for Excel and PDF report exports' },
    { key: 'DAILY_SUMMARY_FORMULA', value: 'NET_COLLECTION_MINUS_PURCHASE', category: 'GENERAL', description: 'Formula to calculate Net Total in daily summary' },
  ];

  for (const s of settingsData) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value, category: s.category, description: s.description },
      create: { key: s.key, value: s.value, category: s.category, description: s.description },
    });
  }

  // 5. Purge Any Legacy Dummy Business Records (Clean Slate for Production)
  await prisma.payment.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.dispatchItem.deleteMany({});
  await prisma.dispatch.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.quotationRevision.deleteMany({});
  await prisma.quotationItem.deleteMany({});
  await prisma.quotation.deleteMany({});
  await prisma.enquiryTimeline.deleteMany({});
  await prisma.enquiry.deleteMany({});
  await prisma.purchase.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.dailyAdjustment.deleteMany({});
  await prisma.dailySummaryLock.deleteMany({});

  // 6. Initialize NumberSequences (Starting from 0 for fresh sequence generation)
  const sequences = [
    { module: 'ENQUIRY', prefix: 'ENQ', year: '2026', lastSequence: 0, formatPattern: '{PREFIX}-{YEAR}-{SEQ:5}' },
    { module: 'QUOTATION', prefix: 'QTN', year: '2026', lastSequence: 0, formatPattern: '{PREFIX}-{YEAR}-{SEQ:5}' },
    { module: 'ORDER', prefix: 'ORD', year: '2026', lastSequence: 0, formatPattern: '{PREFIX}-{YEAR}-{SEQ:5}' },
    { module: 'DISPATCH', prefix: 'DSP', year: '2026', lastSequence: 0, formatPattern: '{PREFIX}-{YEAR}-{SEQ:5}' },
    { module: 'INVOICE', prefix: 'INV', year: '2026-27', lastSequence: 0, formatPattern: '{PREFIX}-{YEAR}-{SEQ:5}' },
    { module: 'PAYMENT', prefix: 'REC', year: '2026', lastSequence: 0, formatPattern: '{PREFIX}-{YEAR}-{SEQ:5}' },
    { module: 'PURCHASE', prefix: 'PUR', year: '2026', lastSequence: 0, formatPattern: '{PREFIX}-{YEAR}-{SEQ:5}' },
  ];

  for (const seq of sequences) {
    await prisma.numberSequence.upsert({
      where: {
        module_year: {
          module: seq.module,
          year: seq.year,
        },
      },
      update: { lastSequence: seq.lastSequence },
      create: seq,
    });
  }

  console.log('[Seed] Database seeding completed successfully.');
  console.log('[Seed] Default credentials:');
  console.log('       Super Admin: admin@powertech.com     / Password@123');
  console.log('       Sales:       sales@powertech.com     / Password@123');
  console.log('       Operations:  operations@powertech.com/ Password@123');
  console.log('       Accounts:    accounts@powertech.com  / Password@123');
  console.log('       Purchase:    purchase@powertech.com  / Password@123');
}

main()
  .catch((e) => {
    console.error('[Seed] Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
