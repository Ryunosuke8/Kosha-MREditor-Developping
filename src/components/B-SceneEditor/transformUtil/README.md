# TransformUtil - 3D オブジェクト変換操作ユーティリティ

## 概要

`transformUtil`は、Babylon.js を使用した 3D シーン内のオブジェクトの移動・回転・拡縮操作を管理するユーティリティです。

## 機能

### 変換モード

- **移動 (Position)**: キー `G` でアクティブ - ワールド座標系での移動
- **回転 (Rotation)**: キー `R` でアクティブ
- **拡縮 (Scale)**: キー `S` でアクティブ
- **無効化**: キー `Escape` でアクティブ

### オブジェクト選択

- マウスクリックでオブジェクトを選択
- 選択されたオブジェクトにのみ Gizmo が表示される
- 複数の glb オブジェクトがある場合、クリックしたオブジェクトのみ操作可能

### 操作方法

1. **オブジェクト選択**: シーン内のオブジェクトをクリック
2. **変換モード切り替え**: キーボードショートカット（G/R/S）を使用
3. **変換操作**: マウスで Gizmo をドラッグして操作
   - **移動**: ワールド座標系（X、Y、Z 軸）に沿った移動
   - **回転**: オブジェクトのローカル座標系での回転
   - **拡縮**: オブジェクトのローカル座標系での拡縮
4. **モード解除**: Escape キーで Gizmo を非表示

## ファイル構成

```
transformUtil/
├── index.ts                 # エクスポート定義
├── objectTransforms.ts      # 変換操作の核心機能
├── transformController.ts   # SceneEditorとの統合用コントローラー
└── README.md               # このファイル
```

## 使用方法

### SceneEditor での統合

```typescript
import { TransformController } from "./transformUtil";

// SceneEditorコンポーネント内で初期化
const transformController = new TransformController(scene, {
  onTransformChanged: (transform) => {
    // 変換が変更された時の処理
    console.log("Transform changed:", transform);
  },
  onModeChanged: (mode) => {
    // 変換モードが変更された時の処理
    console.log("Mode changed:", mode);
  },
});

// マウスクリックイベントの設定
scene.onPointerDown = () => {
  const pickResult = scene.pick(scene.pointerX, scene.pointerY);
  if (pickResult && pickResult.pickedMesh) {
    transformController.handleObjectSelection(pickResult);
  }
};

// クリーンアップ
transformController.cleanup();
```

### 直接使用

```typescript
import { ObjectTransformManager } from "./transformUtil";

const transformManager = new ObjectTransformManager(scene);

// 変換モードの設定
transformManager.setTransformMode("position");

// オブジェクトの選択
transformManager.selectObject(someTransformNode);

// 変換値の取得
const transform = transformManager.getSelectedObjectTransform();
```

## 技術仕様

### 依存関係

- Babylon.js Core
- Babylon.js GizmoManager
- Babylon.js PositionGizmo, RotationGizmo, ScaleGizmo

### 型定義

```typescript
type TransformMode = "position" | "rotation" | "scale" | "none";

interface TransformState {
  mode: TransformMode;
  selectedObject: TransformNode | null;
  gizmoManager: GizmoManager | null;
}

interface TransformControllerCallbacks {
  onTransformChanged?: (
    transform: {
      position: Vector3;
      rotation: Vector3;
      scale: Vector3;
      name: string;
    } | null
  ) => void;
  onObjectSelected?: (object: TransformNode | null) => void;
  onModeChanged?: (mode: TransformMode) => void;
}
```

## 注意事項

1. **キーボードショートカット**: フォーカスが input 要素にある場合は無効
2. **オブジェクト選択**: TransformNode または AbstractMesh のみ選択可能
3. **Gizmo 表示**: 選択されたオブジェクトにのみ表示される
4. **メモリ管理**: コンポーネントのアンマウント時に cleanup()を呼び出す必要がある
5. **非一様スケーリング**: 回転モードで非一様スケーリング（X、Y、Z 軸で異なるスケール値）のオブジェクトを操作する場合、警告が表示される場合があります。より安定した回転操作のためには、一様スケーリングの使用を推奨します。
6. **座標系**: 移動操作は常にワールド座標系で行われ、オブジェクトの回転状態に依存しません。これにより、直感的で予測可能な移動操作が可能です。

## トラブルシューティング

### Gizmo が表示されない

- オブジェクトが正しく選択されているか確認
- 変換モードが正しく設定されているか確認
- オブジェクトが TransformNode または AbstractMesh か確認

### キーボードショートカットが効かない

- フォーカスが input 要素にないか確認
- イベントリスナーが正しく設定されているか確認

### 変換操作が反映されない

- コールバック関数が正しく設定されているか確認
- オブジェクトの型が正しいか確認

### 回転操作で警告が表示される

- オブジェクトが非一様スケーリング（X、Y、Z 軸で異なるスケール値）を持っている可能性があります
- スケールモード（S キー）で一様スケーリングに調整することを推奨します
- 警告は表示されますが、回転操作自体は動作します
