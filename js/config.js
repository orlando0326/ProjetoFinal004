// Configuração do sistema.
// A API ASP.NET Core do projeto usa a porta HTTP 60529 (Properties/launchSettings.json).
// Para testar sem iniciar o backend, altere USAR_API para false.
// IMPORTANTE: localhost só funciona no mesmo computador em que a API está rodando.
// Para acessar pelo celular, use o IP local do computador e configure a API para aceitar conexões da rede.
const USAR_API = true;
const API_URL = "http://localhost:60529/api";
