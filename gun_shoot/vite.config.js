import { defineConfig } from 'vite';

export default defineConfig({
  // base: './' → 상대 경로로 산출물을 생성하므로, 사이트 루트든 서브 디렉토리든
  // (예: https://apostlez.github.io/anna_games/gun_shoot/) 어디에 배포하든
  // 이 값을 매번 변경할 필요가 없다.
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  server: {
    port: 5173,
    open: true
  }
});
