// Production (dipakai saat `ng build`)
export const environment = {
  production: true,
  // Relatif: di server, Nginx meneruskan /api/ ke Spring Boot (domain sama, tanpa CORS)
  apiUrl: '/api/v1',
  // Client ID bukan rahasia, aman ada di frontend
  googleClientId: '5921402582-m2ru48b15m7o4bgl9m33sar9k02mmg36.apps.googleusercontent.com',
};
