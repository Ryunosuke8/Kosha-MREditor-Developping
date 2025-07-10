# Kosha MR Editor

3Dモデル（GLB/PLYファイル）を読み込んで表示・編集するWebアプリケーションです。Babylon.jsを使用した3Dレンダリングと、ドラッグ&ドロップによるファイル読み込み機能を提供します。

## 機能

### 3Dエディター機能
- **ファイル読み込み**: GLB/PLYファイルのドラッグ&ドロップ
- **3D表示**: Babylon.jsによる高品質な3Dレンダリング
- **オブジェクト操作**: 選択、移動、回転、スケール変更
- **プロパティ編集**: 数値による精密な位置・回転・スケール調整
- **アセット管理**: 読み込んだファイルの一覧表示と削除

### アップロード機能
- **一括アップロード**: アセットリストにあるすべてのGLBファイルをサーバーにアップロード
- **進捗表示**: リアルタイムのアップロード進捗バー
- **エラーハンドリング**: アップロード失敗時の適切なエラー表示

## 技術スタック

- **フロントエンド**: React 19 + TypeScript
- **3Dエンジン**: Babylon.js 8.12
- **スタイリング**: Tailwind CSS
- **ビルドツール**: Vite

## セットアップ

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 環境変数の設定
プロジェクトルートに`.env`ファイルを作成し、アップロード先のURLを設定：

```bash
# アップロード先のURLを設定
# 例: http://localhost:3000/api/upload-glb
# 例: https://your-server.com/api/upload-glb
VITE_UPLOAD_URL=/api/upload-glb
```

### 3. 開発サーバーの起動
```bash
npm run dev
```

## 使用方法

### 基本的な使い方
1. ブラウザでアプリケーションを開く
2. GLB/PLYファイルを中央のエディターエリアにドラッグ&ドロップ
3. 3Dモデルが表示され、右パネルのアセットリストに追加される
4. モデルをクリックして選択し、左パネルでプロパティを編集

### アップロード機能の使用
1. GLBファイルを読み込む
2. 右パネルの「Upload All GLB Files」ボタンをクリック
3. 進捗バーでアップロード状況を確認
4. 完了後、結果がアラートで表示される

## アップロード機能の設定

### アップロードURLの設定方法

#### 1. 環境変数を使用（推奨）
`.env`ファイルで設定：
```bash
VITE_UPLOAD_URL=https://your-server.com/api/upload-glb
```

#### 2. コードで直接指定
`src/components/E-AssetList/AssetList.tsx`の`handleUploadAllGLB`関数で変更：
```typescript
const result = await uploadGLBFilesToServer(glbAssets, (progress) => {
  setUploadProgress(progress);
}, 'https://your-server.com/api/upload-glb');
```

### サーバー側のAPI要件

アップロード先のサーバーは以下の要件を満たす必要があります：

- **エンドポイント**: POST `/api/upload-glb`（または設定したURL）
- **Content-Type**: `multipart/form-data`
- **パラメータ**:
  - `file`: GLBファイル（Blob）
  - `assetId`: アセットのID
  - `assetName`: アセットの名前

#### レスポンス形式
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "fileId": "unique-file-id"
}
```

## ファイル構成

```
src/
├── components/
│   ├── A-Header/           # ヘッダー
│   ├── B-SceneEditor/      # 3Dシーンエディター
│   │   ├── importUtil/     # ファイル読み込み機能
│   │   └── transformUtil/  # トランスフォーム制御
│   ├── C-EditorToolbar/    # エディターツールバー
│   ├── D-SceneProperties/  # プロパティパネル
│   └── E-AssetList/        # アセットリスト
│       └── utils/
│           ├── assetDisplayUtils.ts  # アセット表示ユーティリティ
│           └── uploadUtils.ts        # アップロード機能
├── shared/
│   ├── hooks/
│   │   └── useSceneState.ts # シーン状態管理
│   ├── types/
│   │   └── index.ts         # 型定義
│   └── utils/
│       └── fileUtils.ts     # ファイル処理ユーティリティ
└── App.tsx                  # メインアプリケーション
```

## 開発者向け情報

### アップロード機能の切り替え

現在は`uploadGLBFilesToServer`関数を使用していますが、ダウンロード機能に戻したい場合は：

1. `src/components/E-AssetList/AssetList.tsx`でインポートを変更：
```typescript
import { uploadGLBFiles, type UploadProgress } from './utils/uploadUtils';
```

2. 関数呼び出しを変更：
```typescript
const result = await uploadGLBFiles(glbAssets, (progress) => {
  setUploadProgress(progress);
});
```

### カスタマイズ

- **アップロード先の変更**: `uploadUtils.ts`の`uploadGLBFilesToServer`関数を編集
- **UIの変更**: 各コンポーネントのTSXファイルを編集
- **3D機能の拡張**: `SceneEditor.tsx`と`transformUtil/`フォルダ内のファイルを編集

## トラブルシューティング

### よくある問題

1. **アップロードが失敗する**
   - サーバーが起動しているか確認
   - アップロードURLが正しく設定されているか確認
   - ブラウザの開発者ツールでネットワークエラーを確認

2. **3Dモデルが表示されない**
   - ファイル形式がGLB/PLYであることを確認
   - ブラウザのコンソールでエラーメッセージを確認

3. **環境変数が読み込まれない**
   - `.env`ファイルがプロジェクトルートにあることを確認
   - 開発サーバーを再起動

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
