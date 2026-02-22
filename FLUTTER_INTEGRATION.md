# Integração com Flutter (NuruFit)

Este backend (Node.js/Express) está configurado para funcionar em conjunto com a sua aplicação Flutter.

## 1. Configuração do Firebase Compartilhado

Para que o Flutter e o Web App funcionem juntos, ambos devem usar o **mesmo projeto Firebase**.

1.  Acesse o [Firebase Console](https://console.firebase.google.com/).
2.  Vá em **Project Settings**.
3.  Adicione um app **Android** e/ou **iOS** ao mesmo projeto do Web App.
4.  Baixe os arquivos de configuração:
    *   **Android**: `google-services.json` (coloque em `android/app/`)
    *   **iOS**: `GoogleService-Info.plist` (coloque em `ios/Runner/`)

## 2. Autenticação no Flutter

No seu app Flutter, use o pacote `firebase_auth` para fazer login. O token gerado pelo Flutter é válido para este backend.

```dart
// Exemplo no Flutter
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;

Future<void> syncWithBackend() async {
  User? user = FirebaseAuth.instance.currentUser;
  if (user == null) return;

  // 1. Obter o ID Token
  String? token = await user.getIdToken();

  // 2. Chamar o Backend
  final response = await http.get(
    Uri.parse('https://SEU-APP-URL.run.app/api/flutter/sync'),
    headers: {
      'Authorization': 'Bearer $token',
    },
  );

  if (response.statusCode == 200) {
    print('Sync success: ${response.body}');
  } else {
    print('Sync failed: ${response.statusCode}');
  }
}
```

## 3. Endpoints Disponíveis

### `GET /api/flutter/sync`
Retorna os dados do usuário sincronizados do Firestore e informações do servidor.
*   **Auth**: Requer Header `Authorization: Bearer <FIREBASE_ID_TOKEN>`
*   **Response**: JSON com perfil do usuário e timestamp.

### `GET /api/health`
Verifica se o servidor está online.
*   **Auth**: Pública.

## 4. Banco de Dados (Firestore)

O Flutter pode acessar o Firestore diretamente usando o pacote `cloud_firestore`. Como o backend também usa o Admin SDK para acessar o Firestore, os dados estarão sempre sincronizados.

*   **Coleção de Usuários**: `users/{uid}`
*   **Coleção de Treinos**: `workouts/{workoutId}`

Certifique-se de que as **Regras de Segurança do Firestore** permitem que o usuário autenticado leia/escreva seus próprios dados.
