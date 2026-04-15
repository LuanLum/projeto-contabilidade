export type TemplateAccount = {
  codigo: string;
  nome: string;
  tipo: 'Ativo' | 'Passivo' | 'Receita' | 'Despesa';
  aceitaLancamento: boolean;
};

export type TemplateTransaction = {
  dataOffset: number; // Offset em dias a partir de "hoje"
  historico: string;
  movimentacoes: {
    codigoConta: string;
    natureza: 'Debito' | 'Credito';
    valor: number;
  }[];
};

export type CompanyTemplate = {
  id: string;
  name: string;
  description: string;
  accounts: TemplateAccount[];
  sampleTransactions: TemplateTransaction[];
};

export const TEMPLATES: Record<string, CompanyTemplate> = {
  servicos: {
    id: 'servicos',
    name: 'Empresa de Serviços',
    description: 'Focada em consultoria, desenvolvimento e serviços especializados.',
    accounts: [
      { codigo: '1', nome: 'ATIVO', tipo: 'Ativo', aceitaLancamento: false },
      { codigo: '1.1', nome: 'CIRCULANTE', tipo: 'Ativo', aceitaLancamento: false },
      { codigo: '1.1.1', nome: 'CAIXA E EQUIVALENTES', tipo: 'Ativo', aceitaLancamento: true },
      { codigo: '1.1.2', nome: 'CONTAS A RECEBER', tipo: 'Ativo', aceitaLancamento: true },
      { codigo: '2', nome: 'PASSIVO', tipo: 'Passivo', aceitaLancamento: false },
      { codigo: '2.1', nome: 'CIRCULANTE', tipo: 'Passivo', aceitaLancamento: false },
      { codigo: '2.1.1', nome: 'FORNECEDORES', tipo: 'Passivo', aceitaLancamento: true },
      { codigo: '3', nome: 'RECEITAS', tipo: 'Receita', aceitaLancamento: false },
      { codigo: '3.1', nome: 'RECEITA DE SERVICOS', tipo: 'Receita', aceitaLancamento: true },
      { codigo: '4', nome: 'DESPESAS', tipo: 'Despesa', aceitaLancamento: false },
      { codigo: '4.1', nome: 'DESPESAS ADMINISTRATIVAS', tipo: 'Despesa', aceitaLancamento: true },
      { codigo: '4.1.1', nome: 'ALUGUEL', tipo: 'Despesa', aceitaLancamento: true },
    ],
    sampleTransactions: [
      {
        dataOffset: -5,
        historico: 'Recebimento de consultoria de software',
        movimentacoes: [
          { codigoConta: '1.1.1', natureza: 'Debito', valor: 5000 },
          { codigoConta: '3.1', natureza: 'Credito', valor: 5000 },
        ]
      },
      {
        dataOffset: -2,
        historico: 'Pagamento de aluguel do escritorio',
        movimentacoes: [
          { codigoConta: '4.1.1', natureza: 'Debito', valor: 1500 },
          { codigoConta: '1.1.1', natureza: 'Credito', valor: 1500 },
        ]
      }
    ]
  },
  comercio: {
    id: 'comercio',
    name: 'Comércio Varejista',
    description: 'Focada em venda de produtos, controle de estoque e CMV.',
    accounts: [
      { codigo: '1', nome: 'ATIVO', tipo: 'Ativo', aceitaLancamento: false },
      { codigo: '1.1', nome: 'CIRCULANTE', tipo: 'Ativo', aceitaLancamento: false },
      { codigo: '1.1.1', nome: 'BANCO CONTA MOVIMENTO', tipo: 'Ativo', aceitaLancamento: true },
      { codigo: '1.1.5', nome: 'ESTOQUE DE MERCADORIAS', tipo: 'Ativo', aceitaLancamento: true },
      { codigo: '2', nome: 'PASSIVO', tipo: 'Passivo', aceitaLancamento: false },
      { codigo: '2.1', nome: 'FORNECEDORES DE PRODUTOS', tipo: 'Passivo', aceitaLancamento: true },
      { codigo: '3', nome: 'RECEITAS', tipo: 'Receita', aceitaLancamento: false },
      { codigo: '3.1', nome: 'VENDAS DE MERCADORIAS', tipo: 'Receita', aceitaLancamento: true },
      { codigo: '4', nome: 'DESPESAS', tipo: 'Despesa', aceitaLancamento: false },
      { codigo: '4.2', nome: 'CUSTO DAS MERCADORIAS VENDIDAS', tipo: 'Despesa', aceitaLancamento: true },
    ],
    sampleTransactions: [
      {
        dataOffset: -10,
        historico: 'Compra de estoque para revenda',
        movimentacoes: [
          { codigoConta: '1.1.5', natureza: 'Debito', valor: 10000 },
          { codigoConta: '2.1', natureza: 'Credito', valor: 10000 },
        ]
      },
      {
        dataOffset: -1,
        historico: 'Venda de produtos a vista',
        movimentacoes: [
          { codigoConta: '1.1.1', natureza: 'Debito', valor: 2500 },
          { codigoConta: '3.1', natureza: 'Credito', valor: 2500 },
        ]
      }
    ]
  },
  industria: {
    id: 'industria',
    name: 'Indústria / Produção',
    description: 'Focada em transformação de matéria-prima e produtos acabados.',
    accounts: [
      { codigo: '1', nome: 'ATIVO', tipo: 'Ativo', aceitaLancamento: false },
      { codigo: '1.1.6', nome: 'MATERIA-PRIMA', tipo: 'Ativo', aceitaLancamento: true },
      { codigo: '1.1.7', nome: 'PRODUTOS EM ELABORACAO', tipo: 'Ativo', aceitaLancamento: true },
      { codigo: '1.1.8', nome: 'PRODUTOS ACABADOS', tipo: 'Ativo', aceitaLancamento: true },
      { codigo: '2', nome: 'PASSIVO', tipo: 'Passivo', aceitaLancamento: false },
      { codigo: '3', nome: 'RECEITAS', tipo: 'Receita', aceitaLancamento: false },
      { codigo: '4', nome: 'DESPESAS', tipo: 'Despesa', aceitaLancamento: false },
      { codigo: '4.3', nome: 'CUSTO DE FABRICACAO', tipo: 'Despesa', aceitaLancamento: true },
    ],
    sampleTransactions: []
  }
};
