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

  // 5. Seed Customers
  const customer1 = await prisma.customer.create({
    data: {
      customerType: 'COMPANY',
      name: 'Aditya Deshmukh',
      companyName: 'Apex Solar Energy Ltd.',
      phone: '9876543210',
      email: 'procurement@apexsolar.com',
      address: 'Plot 42, Hinjewadi Phase 2, Pune',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411057',
      gstin: '27AABCA1234D1ZM',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      customerType: 'INDIVIDUAL',
      name: 'Rajesh Sharma',
      companyName: null,
      phone: '9823012345',
      email: 'rajesh.sharma@gmail.com',
      address: 'Flat 402, Green Valley Apartments, Andheri West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400058',
    },
  });

  // 6. Seed Supplier
  const supplier1 = await prisma.supplier.create({
    data: {
      name: 'Vikram Mehta',
      companyName: 'Voltech Transformers & Components Ltd.',
      phone: '9898765432',
      email: 'sales@voltechelec.com',
      address: 'Sector 18, Industrial Estate, Thane West',
      city: 'Thane',
      state: 'Maharashtra',
      pincode: '400604',
      gstin: '27XYZPA5678B1ZQ',
    },
  });

  // 7. Full Enquiry-to-Payment Demo Flow
  const adminUser = createdUsers['admin@powertech.com'];
  const salesUser = createdUsers['sales@powertech.com'];
  const opsUser = createdUsers['operations@powertech.com'];
  const acctUser = createdUsers['accounts@powertech.com'];

  // 7.1 Enquiry
  const enquiry = await prisma.enquiry.create({
    data: {
      enquiryNumber: 'ENQ-2026-00001',
      customerId: customer1.id,
      customerType: 'COMPANY',
      customerName: customer1.companyName || customer1.name,
      phone: customer1.phone,
      address: customer1.address,
      requirements: 'Supply and installation of 50kVA Three-Phase Industrial Online UPS System with 120V Battery Bank and Rack.',
      remarks: 'Client requests quick turnaround within 14 working days.',
      status: 'ORDER_PLACED',
      assignedUserId: salesUser.id,
      createdById: salesUser.id,
      timeline: {
        create: [
          { action: 'CREATED', description: 'Enquiry recorded from client phone call.', performedBy: salesUser.name },
          { action: 'STATUS_CHANGE', description: 'Status changed to Quotation Prepared.', performedBy: salesUser.name },
          { action: 'STATUS_CHANGE', description: 'Quotation accepted and Order placed.', performedBy: salesUser.name },
        ],
      },
    },
  });

  // 7.2 Quotation
  const quotation = await prisma.quotation.create({
    data: {
      quotationNumber: 'QTN-2026-00001',
      revisionNumber: 0,
      fullNumber: 'QTN-2026-00001',
      enquiryId: enquiry.id,
      customerId: customer1.id,
      subtotal: 350000,
      discountType: 'PERCENT',
      discountValue: 10,
      discountAmount: 35000,
      taxRate: 18,
      taxAmount: 56700,
      totalAmount: 371700,
      specificationNotes: 'Industrial Grade 50kVA UPS, Pure Sine Wave, IGBT based, including Battery Stand & Interconnecting Cables.',
      termsAndConditions: 'Validity: 30 days. Delivery: 10 to 14 days from PO. Warranty: 2 Years comprehensive onsite.',
      status: 'CONVERTED_TO_ORDER',
      createdById: salesUser.id,
      items: {
        create: [
          {
            itemDescription: '50kVA Three-Phase Online UPS System',
            specification: '415V AC Input/Output, 0.9 PF, Microprocessor Controlled',
            quantity: 1,
            unit: 'Set',
            rate: 250000,
            amount: 250000,
            sortOrder: 1,
          },
          {
            itemDescription: '12V 100Ah VRLA SMF Battery Bank (Set of 10)',
            specification: 'Deep discharge, sealed maintenance-free lead acid',
            quantity: 1,
            unit: 'Set',
            rate: 85000,
            amount: 85000,
            sortOrder: 2,
          },
          {
            itemDescription: 'Battery Rack, DC Isolator & Interlink Wiring Kit',
            specification: 'Heavy duty powder-coated MS enclosure with safety breakers',
            quantity: 1,
            unit: 'Set',
            rate: 15000,
            amount: 15000,
            sortOrder: 3,
          },
        ],
      },
    },
  });

  // 7.3 Order
  const order = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2026-00001',
      enquiryId: enquiry.id,
      quotationId: quotation.id,
      customerId: customer1.id,
      subtotal: 350000,
      discountAmount: 35000,
      taxAmount: 56700,
      totalAmount: 371700,
      agreedPaymentTerms: '50% advance on PO, 50% upon delivery inspection. Due within 30 days.',
      dueDays: 30,
      status: 'DELIVERED',
      createdById: salesUser.id,
      items: {
        create: [
          {
            itemDescription: '50kVA Three-Phase Online UPS System',
            specification: '415V AC Input/Output, 0.9 PF',
            quantity: 1,
            unit: 'Set',
            rate: 250000,
            amount: 250000,
            dispatchedQty: 1,
            sortOrder: 1,
          },
          {
            itemDescription: '12V 100Ah VRLA SMF Battery Bank (Set of 10)',
            specification: 'Deep discharge, sealed maintenance-free',
            quantity: 1,
            unit: 'Set',
            rate: 85000,
            amount: 85000,
            dispatchedQty: 1,
            sortOrder: 2,
          },
          {
            itemDescription: 'Battery Rack, DC Isolator & Interlink Wiring Kit',
            specification: 'Heavy duty powder-coated MS enclosure',
            quantity: 1,
            unit: 'Set',
            rate: 15000,
            amount: 15000,
            dispatchedQty: 1,
            sortOrder: 3,
          },
        ],
      },
    },
    include: {
      items: true,
    },
  });

  // 7.4 Dispatch
  const dispatch = await prisma.dispatch.create({
    data: {
      dispatchNumber: 'DSP-2026-00001',
      orderId: order.id,
      transportCourier: 'VRL Logistics Express',
      trackingNumber: 'VRL-PUN-982144',
      deliveryAddress: customer1.address,
      expectedDeliveryDate: new Date(),
      actualDeliveryDate: new Date(),
      actualDeliveryTime: '14:30 IST',
      deliveryStatus: 'DELIVERED',
      remarks: 'Delivered in full. Goods received by Site In-charge Mr. Ramesh Patil in sound condition.',
      createdById: opsUser.id,
      items: {
        create: order.items.map((oi) => ({
          orderItemId: oi.id,
          quantity: oi.quantity,
        })),
      },
    },
  });

  // 7.5 Invoice
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-27-00001',
      invoiceType: 'SYSTEM_GENERATED',
      orderId: order.id,
      customerId: customer1.id,
      customerGstin: customer1.gstin,
      placeOfSupply: 'Maharashtra (27)',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subtotal: 350000,
      discountAmount: 35000,
      cgstRate: 9,
      cgstAmount: 28350,
      sgstRate: 9,
      sgstAmount: 28350,
      igstRate: 0,
      igstAmount: 0,
      taxAmount: 56700,
      totalAmount: 371700,
      amountReceived: 185850,
      balanceAmount: 185850,
      paymentStatus: 'PARTIALLY_PAID',
      paymentTerms: '50% advance received, balance payable within 30 days.',
      isLocked: true,
      createdById: acctUser.id,
      items: {
        create: [
          {
            itemDescription: '50kVA Three-Phase Online UPS System',
            hsnSacCode: '85044090',
            quantity: 1,
            unit: 'Set',
            rate: 250000,
            amount: 250000,
          },
          {
            itemDescription: '12V 100Ah VRLA SMF Battery Bank',
            hsnSacCode: '85072000',
            quantity: 1,
            unit: 'Set',
            rate: 85000,
            amount: 85000,
          },
          {
            itemDescription: 'Battery Rack and Accessories',
            hsnSacCode: '85049090',
            quantity: 1,
            unit: 'Set',
            rate: 15000,
            amount: 15000,
          },
        ],
      },
    },
  });

  // 7.6 Payment (Advance part-payment)
  await prisma.payment.create({
    data: {
      receiptNumber: 'REC-2026-00001',
      invoiceId: invoice.id,
      paymentMode: 'BANK_TRANSFER',
      amountReceived: 185850,
      referenceNumber: 'NEFT-HDFC-99281745',
      bankName: 'HDFC Bank Ltd.',
      remarks: '50% advance against Order ORD-2026-00001.',
      receivedById: acctUser.id,
    },
  });

  // 7.7 Purchase Record
  await prisma.purchase.create({
    data: {
      purchaseNumber: 'PUR-2026-00001',
      supplierId: supplier1.id,
      supplierBillNo: 'VOL/2026/8841',
      description: 'Procurement of copper coils and IGBT semiconductors for UPS assembly',
      category: 'RAW_MATERIAL',
      subtotal: 120000,
      taxRate: 18,
      taxAmount: 21600,
      totalAmount: 141600,
      paymentStatus: 'PAID',
      createdById: createdUsers['purchase@powertech.com'].id,
    },
  });

  // 8. Initialize NumberSequences
  const sequences = [
    { module: 'ENQUIRY', prefix: 'ENQ', year: '2026', lastSequence: 1, formatPattern: '{PREFIX}-{YEAR}-{SEQ:5}' },
    { module: 'QUOTATION', prefix: 'QTN', year: '2026', lastSequence: 1, formatPattern: '{PREFIX}-{YEAR}-{SEQ:5}' },
    { module: 'ORDER', prefix: 'ORD', year: '2026', lastSequence: 1, formatPattern: '{PREFIX}-{YEAR}-{SEQ:5}' },
    { module: 'DISPATCH', prefix: 'DSP', year: '2026', lastSequence: 1, formatPattern: '{PREFIX}-{YEAR}-{SEQ:5}' },
    { module: 'INVOICE', prefix: 'INV', year: '2026-27', lastSequence: 1, formatPattern: '{PREFIX}-{YEAR}-{SEQ:5}' },
    { module: 'PAYMENT', prefix: 'REC', year: '2026', lastSequence: 1, formatPattern: '{PREFIX}-{YEAR}-{SEQ:5}' },
    { module: 'PURCHASE', prefix: 'PUR', year: '2026', lastSequence: 1, formatPattern: '{PREFIX}-{YEAR}-{SEQ:5}' },
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
