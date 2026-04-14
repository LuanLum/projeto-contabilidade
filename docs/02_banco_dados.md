// ==========================================
// ENUMS (Domínios Restritos)
// ==========================================

Enum tipo_conta {
  "Ativo"
  "Passivo"
  "Receita"
  "Despesa"
}

Enum natureza_mov {
  "Debito"
  "Credito"
}

Enum status_bem {
  "Ativo"
  "Baixado"
  "Vendido"
}

// ==========================================
// TABELAS
// ==========================================

Table conta_contabil {
  id int [pk, increment]
  codigo varchar(50) [not null, unique, note: "Ex: 1, 1.1, 1.1.1"]
  nome varchar(255) [not null]
  tipo tipo_conta [not null]
  aceita_lancamento boolean [not null, default: false]
  conta_pai_id int [null, note: "Null para contas raízes"]
  
  Note: "Armazena a hierarquia completa do plano de contas da empresa."
}

Table lancamento_contabil {
  id int [pk, increment]
  data_ocorrencia date [not null]
  descricao_historico text [not null]
  documento_referencia varchar(100) [null]
  criado_em timestamp [not null, default: `now()`]
  
  Note: "Registra o fato gerador (o cabeçalho da transação)."
}

Table movimentacao_item {
  id int [pk, increment]
  lancamento_id int [not null]
  conta_id int [not null]
  natureza natureza_mov [not null]
  valor numeric(15,2) [not null, note: "Precisão financeira obrigatória. Não aceita negativos."]
  
  Note: "As pernas de Débito e Crédito do lançamento."
}

Table bem_patrimonial {
  id int [pk, increment]
  nome varchar(255) [not null]
  data_aquisicao date [not null]
  valor_aquisicao numeric(15,2) [not null]
  taxa_depreciacao_anual numeric(5,2) [not null, note: "Ex: 20.00 para 20%"]
  status status_bem [not null, default: 'Ativo']
  conta_imobilizado_id int [not null]
  
  Note: "Controle de bens físicos duráveis comprados pela empresa (Imobilizado)."
}

// ==========================================
// RELACIONAMENTOS (Chaves Estrangeiras)
// ==========================================

Ref "fk_conta_pai": conta_contabil.id < conta_contabil.conta_pai_id 
Ref "fk_movimentacao_lancamento": lancamento_contabil.id < movimentacao_item.lancamento_id [delete: cascade]
Ref "fk_movimentacao_conta": conta_contabil.id < movimentacao_item.conta_id [delete: restrict]
Ref "fk_bem_conta": conta_contabil.id - bem_patrimonial.conta_imobilizado_id [delete: restrict]
