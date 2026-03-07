require("dotenv").config();
const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const cors = require("cors");

// Importações dos novos módulos
const TransacaoRepository = require("./repositories/TransacaoRepository");

const app = express();
app.use(cors());
app.use(express.json());

// Conexão com o Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

const transacaoRepo = new TransacaoRepository(supabase);

app.get("/transacoes", async (req, res) => {
  try {
    const dados = await transacaoRepo.listarTodos();
    res.json(dados);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.post("/transacoes", async (req, res) => {
  try {
    // Exemplo de corpo: { "descricao": "Venda", "valor": 150.00, "tipo": "receita" }
    const novaTransacao = await transacaoRepo.criar(req.body);
    res.status(201).json(novaTransacao);
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () =>
  console.log(`🚀 Backend rodando em http://localhost:${PORT}`),
);
