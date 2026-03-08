# 1. Escolhemos a imagem oficial do Node (leve e segura)
FROM node:20-slim
# 2. Criamos a pasta do app dentro do "container"
WORKDIR /app
# 3. Copiamos os arquivos de dependências
COPY package*.json ./
# 4. Instalamos as bibliotecas (exatamente como no seu PC)
RUN npm install --production
# 5. Copiamos o resto do código
COPY . .
# 6. A porta que o seu servidor usa
EXPOSE 3001
# 7. O comando para ligar o servidor
CMD ["node", "index.js"]