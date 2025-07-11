# Blender風 3D 編集画面プロトタイプ 設計書 v2.0

## プロジェクト概要

Blender風の 3D 編集画面のプロトタイプ開発プロジェクト。glb/ply ファイルのドラッグ&ドロップによる 3D シーン編集機能の実証を目的とする。

## 技術スタック

### フロントエンド

- **React**: 18.x  
- **ビルドツール**: Vite  
- **スタイリング**: Tailwind CSS  
- **3D エンジン**: Babylon.js  
- **状態管理**: React useState/useContext

## アーキテクチャ設計

### ディレクトリ構成

```
src/
├── components/
│   ├── A/                    # 画面A用コンポーネント
│   │   ├── index.jsx
│   │   └── utils/           # A画面専用util
│   ├── B/                    # 3D編集画面用コンポーネント（メインハブ）
│   │   ├── index.jsx
│   │   ├── Canvas3D.jsx
│   │   ├── DragDropZone.jsx
│   │   └── utils/           # B画面専用util + 連携処理util
│   │       ├── dragDropHandler.js      # D&D処理
│   │       ├── sceneManager.js         # Babylon.jsシーン管理
│   │       ├── objectTransforms.js     # オブジェクト変換処理
│   │       ├── propertySync.js         # B-D間連携（プロパティ同期）
│   │       └── assetSync.js            # B-E間連携（アセット管理同期）
│   ├── C/                    # 編集画面の設定調整用ヘッダーコンポーネント
│   │   ├── index.jsx
│   │   └── utils/           # ヘッダー機能用util
│   ├── D/                    # シーンプロパティ用コンポーネント（表示専用）
│   │   ├── index.jsx
│   │   ├── PropertyPanel.jsx
│   │   └── utils/           # 表示・フォーマット用util
│   │       └── formatters.js           # プロパティ値表示フォーマット
│   └── E/                    # アセット管理画面用コンポーネント
│       ├── index.jsx
│       ├── AssetList.jsx
│       └── utils/           # アセット表示用util
│           └── assetDisplayUtils.js    # アセット一覧表示処理
├── shared/
│   ├── utils/               # 複数画面で共有するutil
│   │   ├── fileValidation.js           # ファイル形式検証
│   │   ├── babylonCore.js              # Babylon.js基本機能
│   │   └── constants.js                # 定数定義
│   ├── hooks/               # 共有React hooks
│   │   ├── useSceneState.js            # シーン状態管理
│   │   └── useFileHandler.js           # ファイル処理
│   └── types/               # TypeScript型定義（使う場合）
```

### 実装ルール

#### コンポーネント配置ルール
- 各画面の機能は対応するフォルダ内にファイルを作成して実装すること
- 画面専用のutilは `[画面]/utils/` 内に配置すること
- 複数画面で使用するutilは `shared/utils/` に配置すること
- 特に B の編集画面については、Babylon.js を表示する画面で canvas をフルサイズで使用

#### 画面間連携ルール

**データフロー**: B画面（ハブ） → D画面/E画面

- **B画面が連携の起点**: 全ての画面間連携utilはB/utils/に配置
- **D・E画面は受け手**: 表示・フォーマット用utilのみ保持
- **他画面のutils/は直接import禁止**: 必ずB画面経由でデータを連携

#### 必須実装ユーティリティ

**B画面必須util:**
- `dragDropHandler.js` - ドラッグ&ドロップ処理
- `sceneManager.js` - Babylon.jsシーン管理
- `objectTransforms.js` - オブジェクト変換処理
- `propertySync.js` - D画面への選択オブジェクト情報送信
- `assetSync.js` - E画面へのアセット一覧情報送信

**D画面必須util:**
- `formatters.js` - プロパティ値の表示用フォーマット

**E画面必須util:**
- `assetDisplayUtils.js` - アセット一覧の表示処理

## 機能要件

### B. 3D 編集画面（メイン機能・データハブ）

#### 3D ビューワー

- Babylon.js による 3D ビューワー（画面 100%の大きさ）  
- カメラ操作機能  
  - ズーム  
  - パン  
  - 回転

#### ファイル操作

- **ドラッグ&ドロップ UI実装仕様**:
  - ドロップゾーンの視覚的フィードバック（境界線、ハイライト）
  - ドラッグオーバー時の状態変化表示
  - 対応ファイル形式：glb/ply ファイル
  - ファイル形式検証とエラーハンドリング
  - 非同期ファイル読み込み処理
- **処理フロー**: ファイル受信 → 検証 → パース → Babylon.js追加 → 他画面同期

#### オブジェクト選択機能

- クリック選択  
- 選択状態の視覚化
- **選択時連携**: D画面のプロパティパネル自動更新

#### 変換操作

- 移動・回転・スケール操作  
- リアルタイム更新機能
- **変換時連携**: D画面プロパティ値リアルタイム反映

#### アセット操作

- 座標移動（X, Y, Z 軸）  
- 回転（X, Y, Z 軸）  
- スケール変更（X, Y, Z 軸）  
- 変換を支援する視覚ツールの選択時表示
- **操作時連携**: E画面アセット一覧の状態同期

#### 他画面連携管理

- **D画面連携**: 選択オブジェクトのプロパティ情報送信
- **E画面連携**: シーン内全アセットの状態情報送信
- **状態同期**: オブジェクト追加・削除・変更時の即座反映

### C. ヘッダーコンポーネント

#### 設定調整機能

- 編集モード切り替え
- 表示設定調整
- ツール選択UI

### D. シーンプロパティ用コンポーネント（表示専用）

#### プロパティパネル

- **データ受信**: B画面から選択オブジェクト情報を受信
- **表示項目**:
  - オブジェクト名
  - 座標値（X, Y, Z）
  - 回転値（X, Y, Z）
  - スケール値（X, Y, Z）
- **フォーマット処理**: 数値の桁数制限、単位表示

#### リアルタイム更新

- B画面での選択変更に即座対応
- B画面での変換操作のリアルタイム反映

### E. アセット管理画面

#### アセット一覧パネル

- **データ受信**: B画面からシーン内全アセット情報を受信
- アイコン表示  
- 名前編集機能  
- B 画面上に存在するアセットの一覧パネル表示

#### アセット管理機能

- 削除機能
- **削除時連携**: B画面シーンから対象オブジェクト削除

## 詳細実装仕様

### ドラッグ&ドロップ機能仕様（B/utils/dragDropHandler.js）

#### 視覚フィードバック
- ドラッグエンター時: 境界線表示 + 背景色変更
- ドラッグオーバー時: ドロップ可能状態の視覚化
- ドラッグリーブ時: 通常状態に復帰

#### ファイル処理パイプライン
1. ファイルドロップ検知
2. ファイル形式検証（.glb/.ply チェック）
3. ファイルサイズ制限チェック
4. FileReader による非同期読み込み
5. Babylon.js への追加処理
6. エラー時の適切なフィードバック表示

#### エラーハンドリング
- 未対応ファイル形式時: 「対応ファイル形式は .glb, .ply です」
- ファイル破損時: 「ファイルの読み込みに失敗しました」
- 容量超過時: 「ファイルサイズが大きすぎます」

### Babylon.jsシーン管理仕様（B/utils/sceneManager.js）

#### 基本機能
- シーンの初期化と設定
- カメラコントロールの設定
- ライティングの設定
- オブジェクトの追加・削除・選択管理

#### オブジェクト変換機能（B/utils/objectTransforms.js）
- トランスフォームギズモの表示・非表示
- 移動・回転・スケール操作のハンドリング
- 変換値の取得と適用

### 画面間データ同期仕様

#### プロパティ同期（B/utils/propertySync.js）
- 選択オブジェクト変更時のD画面通知
- プロパティ値変更時のリアルタイム送信
- データ形式: `{ name, position: {x, y, z}, rotation: {x, y, z}, scale: {x, y, z} }`

#### アセット同期（B/utils/assetSync.js）
- シーン内全オブジェクトの状態管理
- アセット追加・削除時のE画面通知
- データ形式: `[{ id, name, type, thumbnail, isSelected }]`

## 品質要件

### ユーザビリティ

- 直感的な操作性  
- 適切なエラーハンドリング  
- ファイル形式の検証
- レスポンシブな画面間連携

### パフォーマンス

- 大容量ファイルの非同期処理
- リアルタイム同期の最適化
- メモリリークの防止

## 開発ガイドライン

### コンポーネント設計

- 各画面機能は独立したコンポーネントとして実装  
- 状態管理は React useState/useContext を活用  
- Babylon.js の統合は適切な抽象化レイヤーを通して実装

### ファイル処理

- サポートするファイル形式：.glb, .ply  
- ドラッグ&ドロップ時のファイル形式バリデーション  
- エラー時の適切なフィードバック

### 3D 操作

- Babylon.js のカメラコントロールを活用  
- オブジェクト選択・変換のインタラクション実装  
- 視覚的フィードバックの提供

### 画面間連携

- B画面をハブとした一方向データフロー
- 状態変更時の即座な他画面反映
- データ整合性の保証

## 成果物

- 動作するプロトタイプアプリケーション  
- 3D ファイルの読み込み・編集・管理機能の実証  
- Blender 風 UI による直感的な操作性の検証
- シームレスな画面間連携機能の実装