# CBSL Documents Helper

Helper local do Windows para abrir arquivos do módulo `Gestão de Documentos` no programa padrão do usuário.

## 1. Rodar manualmente no computador do usuário

```powershell
npm run documents-helper
```

O helper sobe em:

```text
http://127.0.0.1:43125
```

## 2. Instalar para iniciar com o Windows

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-documents-helper.ps1
```

Isso:

- copia o helper para `%LOCALAPPDATA%\CBSLDocumentsHelper`
- cria um atalho em `Inicializar`
- faz o helper subir automaticamente quando o usuário entrar no Windows

## 3. Gerar instalador `.exe` para distribuição

```powershell
npm run documents-helper:package
```

Saída esperada:

```text
dist\documents-helper\CBSL-Documents-Helper-Setup.exe
```

Esse instalador:

- extrai os arquivos necessários
- executa a instalação local do helper
- configura a inicialização automática para o usuário atual

## Observações

- o helper depende de `Node.js` instalado na máquina do usuário
- arquivos são baixados temporariamente em `%TEMP%\cbsl-erp-documents`
- documentos que existirem apenas no Google Drive continuam abrindo no navegador
