# Icon Atlas Generator
複数の画像を1つのアトラス画像（スプライトシート）にまとめ、各画像の位置とサイズ情報をJSON形式で出力するWebアプリケーションです。

https://nabedroid.github.io/icon-atlas-generator/

## 機能

- **アトラス生成**: 複数の画像をアップロードして、1枚の画像に最適に配置します。
- **自動トリミング**: 画像の周囲にある透明な余白を自動的に削除する機能。
- **パディング設定**: 画像間の間隔（パディング）を自由に設定可能。
- **プレビュー**: 生成されたアトラスとJSONデータをリアルタイムでプレビュー確認できます。

## 技術スタック

- **IDE**: Antigravity
- **Frontend**: React, TypeScript, Vite
- **UI Framework**: Material UI (MUI)
- **Environment**: Docker

## 使い方

### ローカルでの実行

Node.jsがインストールされている環境で実行する場合:

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

ブラウザで `http://localhost:5173` (またはコンソールに表示されるURL) にアクセスしてください。

### Dockerでの実行

DockerおよびDocker Composeがインストールされている場合:

```bash
docker-compose up --build
```

ブラウザで `http://localhost:3000` にアクセスしてください。
