const { TABLES } = require("../config");

class TransacaoRepository {
  constructor(supabaseClient) {
    this.client = supabaseClient;
  }

  async listarTodos() {
    const { data, error } = await this.client
      .from(TABLES.TRANSACOES)
      .select("*");
    if (error) throw error;
    return data;
  }

  async criar(transacao) {
    const { data, error } = await this.client
      .from(TABLES.TRANSACOES)
      .insert([transacao]);
    if (error) throw error;
    return data;
  }
}

module.exports = TransacaoRepository;
