FROM node:20-alpine

WORKDIR /app

# Copiar manifesto de dependências
COPY src/frontend/package*.json /app/

# Instalar dependências
RUN npm install

# Copiar código-fonte da aplicação
COPY src/frontend /app

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
