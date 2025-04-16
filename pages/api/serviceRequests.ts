import prisma from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const IdSuppliers = searchParams.get('IdSuppliers');
    const currentId = searchParams.get('currentId');
    const direction = searchParams.get('direction');
    
    if (IdSuppliers) {
      // Obtener solicitudes para un proveedor específico
      const requests = await prisma.serviceRequests.findMany({
        where: { IdSuppliers: Number(IdSuppliers) },
        orderBy: { ApplicationDate: 'desc' },
        include: {
          Suppliers: true,
          SupplierEvaluation: true
        }
      });
      
      return NextResponse.json(requests);
    } else if (currentId && direction) {
      // Navegación entre solicitudes (anterior/siguiente)
      const whereCondition = direction === 'next' 
        ? { Id: { gt: Number(currentId) } }
        : { Id: { lt: Number(currentId) } };
        
      const orderDirection = direction === 'next' ? 'asc' : 'desc';
      
      const request = await prisma.serviceRequests.findFirst({
        where: whereCondition,
        orderBy: { Id: orderDirection },
        include: {
          Suppliers: true,
          SupplierEvaluation: true
        }
      });
      
      return NextResponse.json(request || null);
    } else {
      // Obtener la última solicitud creada
      const lastRequest = await prisma.serviceRequests.findFirst({
        orderBy: { Id: 'desc' },
        include: {
          Suppliers: true,
          SupplierEvaluation: true
        }
      });
      
      return NextResponse.json(lastRequest);
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener solicitudes de servicio' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ApplicationDate, Description, IdSuppliers } = body;
    
    const newRequest = await prisma.serviceRequests.create({
      data: {
        ApplicationDate: new Date(ApplicationDate),
        Description,
        IdSuppliers: Number(IdSuppliers)
      },
      include: {
        Suppliers: true
      }
    });
    
    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: `Error al crear solicitud de servicio: ${error}` },
      { status: 500 }
    );
  }
}