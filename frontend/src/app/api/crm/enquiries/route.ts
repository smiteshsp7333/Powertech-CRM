import { NextRequest, NextResponse } from 'next/server';
import {
  getCloudEnquiries,
  saveSingleCloudEnquiry,
  updateEnquiryField,
  deleteCloudEnquiry,
} from '../../../../lib/crm/cloudCrmStore';
import { Enquiry } from '../../../../types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const singleId = searchParams.get('id');
    const all = await getCloudEnquiries();

    if (singleId) {
      const found = all.find((e) => e.id === singleId);
      if (!found) {
        return NextResponse.json({ success: false, error: 'Enquiry not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: found });
    }

    const search = (searchParams.get('search') || '').trim().toLowerCase();
    const status = searchParams.get('status') || '';
    const customerType = searchParams.get('customerType') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    let filtered = [...all];

    if (search) {
      filtered = filtered.filter(
        (e) =>
          e.enquiryNumber.toLowerCase().includes(search) ||
          e.customerName.toLowerCase().includes(search) ||
          (e.companyName && e.companyName.toLowerCase().includes(search)) ||
          e.phone.includes(search) ||
          (e.requirements && e.requirements.toLowerCase().includes(search))
      );
    }

    if (status) {
      filtered = filtered.filter((e) => {
        if (e.status === status) return true;
        if (status === 'NEW_ENQUIRY' && e.status === 'OPEN') return true;
        if (status === 'ORDER_CONFIRMED' && e.status === 'ORDER_PLACED') return true;
        if (status === 'LOST' && (e.status === 'CLOSED_LOST' || e.status === 'CANCELLED')) return true;
        return false;
      });
    }

    if (customerType) {
      filtered = filtered.filter((e) => e.customerType === customerType);
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      data: paginated,
      all: filtered,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch enquiries' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const existing = await getCloudEnquiries();

    // Generate unique sequential ENQ-YYYY-XXXXX
    const year = new Date().getFullYear();
    const count = existing.length + 1;
    const seq = String(count).padStart(5, '0');
    const enquiryNumber = body.enquiryNumber || `ENQ-${year}-${seq}`;

    const newEnquiry: Enquiry = {
      id: body.id || `enq-${Date.now()}`,
      enquiryNumber,
      enquiryDate: body.enquiryDate || new Date().toISOString(),
      customerName: body.customerName,
      companyName: body.companyName || (body.customerType === 'COMPANY' ? body.customerName : null),
      phone: body.phone,
      address: body.address || null,
      customerType: body.customerType || 'COMPANY',
      requirements: body.requirements || '',
      remarks: body.remarks || null,
      status: body.status || 'OPEN',
      assignedUserId: body.assignedUserId || 'user-sales',
      assignedUser: body.assignedUser || {
        id: 'user-sales',
        name: 'Siddharth Sales',
        email: 'sales@powertechlaser.in',
      },
      createdBy: body.createdBy || { id: 'user-admin', name: 'Super Admin' },
      createdAt: new Date().toISOString(),
      attachments: body.attachments || [],
      quotations: [],
      orders: [],
      timeline: [
        {
          id: `tl-${Date.now()}`,
          action: 'ENQUIRY_CREATED',
          description: `Enquiry ${enquiryNumber} recorded into system`,
          performedBy: body.createdBy?.name || 'Super Admin',
          createdAt: new Date().toISOString(),
        },
      ],
    };

    const updated = await saveSingleCloudEnquiry(newEnquiry);
    return NextResponse.json({ success: true, data: newEnquiry, all: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to save enquiry' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, fields, performedBy } = body;

    if (!id || !fields) {
      return NextResponse.json(
        { success: false, error: 'Missing id or fields payload' },
        { status: 400 }
      );
    }

    const result = await updateEnquiryField(id, fields, performedBy || 'Super Admin');
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result.enquiry });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update enquiry' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id parameter' }, { status: 400 });
    }

    const updated = await deleteCloudEnquiry(id);
    return NextResponse.json({ success: true, all: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to delete enquiry' },
      { status: 500 }
    );
  }
}
