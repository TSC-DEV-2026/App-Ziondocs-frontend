# Consulta de Documentos Wecanbr - Expo

Este pacote é uma migração estrutural do frontend web para Expo/React Native.

## O que já está migrado
- autenticação
- troca obrigatória de senha
- token interno
- home com lista de documentos
- busca/listagem por tipo
- montagem e compartilhamento de PDF
- chat RH básico com polling
- base de API com `axios`
- persistência local com `AsyncStorage`
- navegação com `expo-router`

## O que foi adaptado
- PWA, service worker e Firebase Hosting foram removidos
- integrações baseadas em `window`, `document`, `sessionStorage`, `localStorage` e DOM foram convertidas
- Odoo livechat web foi substituído por um chat nativo consumindo as rotas `/livechat/*`
- preview inline de PDF em aplicativo nativo foi adaptado para **gerar arquivo local e compartilhar/abrir**, porque o WebView do Expo Go não entrega um visualizador PDF nativo confiável em Android/iOS

## Instalação
```bash
npm install
npx expo start
```

## Observação importante
O projeto mobile foi refeito para Expo. Ele reaproveita a mesma API do projeto web, mas a UI foi portada para React Native.  
Se o backend depender exclusivamente de cookies HTTP-only em rotas mobile, talvez seja necessário complementar o backend para aceitar Bearer token em todos os endpoints.
