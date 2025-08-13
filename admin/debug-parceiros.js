// Script de debug para testar as requisições de parceiros
// Execute no console do navegador em http://localhost:5173/parceiros

console.log('=== DEBUG PARCEIROS - VERSÃO 2 ===');

// Verificar token
const token = localStorage.getItem('accessToken');
console.log('Token:', token ? 'Presente' : 'Ausente');

// Verificar configurações do ambiente
console.log('\n--- Configurações do Ambiente ---');
console.log('window.location.origin:', window.location.origin);
console.log('import.meta.env.DEV:', import.meta?.env?.DEV);
console.log('import.meta.env.VITE_API_URL:', import.meta?.env?.VITE_API_URL);

// Testar diferentes URLs
async function testDifferentURLs() {
  console.log('\n--- Testando Diferentes URLs ---');
  
  const testData = {
    nome: 'Teste Debug URL',
    email: 'teste@debug.com',
    ruccnpj: '12345678901',
    currencyId: 1
  };
  
  const urls = [
    '/api/parceiros',           // Com prefixo /api (deveria funcionar)
    '/parceiros',               // Sem prefixo /api (pode estar sendo usado incorretamente)
    'http://localhost:3000/parceiros'  // URL direta do backend
  ];
  
  for (const url of urls) {
    console.log(`\n--- Testando URL: ${url} ---`);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(testData)
      });
      
      console.log('Status:', response.status);
      console.log('StatusText:', response.statusText);
      console.log('URL Final:', response.url);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.log('Error Data:', errorData);
      } else {
        const result = await response.json();
        console.log('Success:', result);
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
    }
  }
}

// Testar o fetch-client diretamente
async function testFetchClient() {
  console.log('\n--- Testando Fetch Client Diretamente ---');
  
  // Simular como o kubb chama o fetch-client
  try {
    // Importar o fetch-client (se disponível no contexto)
    if (window.fetch) {
      const testData = {
        nome: 'Teste Fetch Client',
        email: 'teste@fetchclient.com',
        ruccnpj: '12345678902',
        currencyId: 1
      };
      
      // Simular a chamada do kubb
      const response = await window.fetch('/api/parceiros', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept-Language': 'pt'
        },
        body: JSON.stringify(testData)
      });
      
      console.log('Fetch Client - Status:', response.status);
      console.log('Fetch Client - URL:', response.url);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.log('Fetch Client - Error:', errorData);
      } else {
        const result = await response.json();
        console.log('Fetch Client - Success:', result);
      }
    }
  } catch (error) {
    console.error('Erro no fetch client:', error);
  }
}

// Verificar se há interceptadores ou modificações no fetch
function checkFetchInterceptors() {
  console.log('\n--- Verificando Interceptadores ---');
  console.log('window.fetch === fetch nativo?', window.fetch.toString().includes('[native code]'));
  console.log('window.fetch.name:', window.fetch.name);
}

// Executar todos os testes
async function runAllTests() {
  console.log('Iniciando testes completos...');
  
  checkFetchInterceptors();
  await testDifferentURLs();
  await testFetchClient();
  
  console.log('\n=== FIM DOS TESTES COMPLETOS ===');
}

// Executar automaticamente
runAllTests();

// Disponibilizar funções individualmente
window.debugParceiros = {
  testDifferentURLs,
  testFetchClient,
  checkFetchInterceptors,
  runAllTests
};

console.log('\nFunções disponíveis em window.debugParceiros:');
console.log('- testDifferentURLs()');
console.log('- testFetchClient()');
console.log('- checkFetchInterceptors()');
console.log('- runAllTests()');