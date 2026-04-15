import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    // Test 1: Can we query empresas?
    console.log('Test 1: Querying empresas...');
    const empresas = await prisma.empresa.findMany();
    console.log('Empresas:', JSON.stringify(empresas, null, 2));

    // Test 2: Can we query contas with empresaId?
    console.log('\nTest 2: Querying contas...');
    const contas = await prisma.contaContabil.findMany({ take: 5 });
    console.log('Contas:', JSON.stringify(contas, null, 2));

    // Test 3: Can we query movimentacaoItem with nested lancamento filter?
    console.log('\nTest 3: Querying movimentacoes with nested filter...');
    const movs = await prisma.movimentacaoItem.findMany({
      where: {
        lancamento: {
          empresaId: 1
        }
      },
      take: 3,
      include: { conta: true }
    });
    console.log('Movimentacoes:', JSON.stringify(movs, null, 2));

    // Test 4: Can we create a demo empresa?
    console.log('\nTest 4: Creating demo empresa...');
    const demo = await prisma.empresa.create({
      data: {
        nome: 'TEST DEMO',
        isDemo: true,
        templateId: 'servicos'
      }
    });
    console.log('Demo empresa created:', demo);

    // Cleanup
    await prisma.empresa.delete({ where: { id: demo.id } });
    console.log('Cleanup done.');

  } catch (error) {
    console.error('ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
