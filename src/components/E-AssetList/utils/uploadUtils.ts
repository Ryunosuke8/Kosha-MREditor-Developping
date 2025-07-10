import type { Asset } from '../../../shared/types';

export interface UploadProgress {
    totalFiles: number;
    currentFile: number;
    fileName: string;
    progress: number;
}

export interface UploadResult {
    success: boolean;
    message: string;
    uploadedFiles?: string[];
    errors?: string[];
}

/**
 * GLBファイルをアップロードする関数（デモ版 - 実際のアップロードの代わりにダウンロード）
 * @param assets アップロードするアセットの配列
 * @param onProgress 進捗コールバック
 * @returns アップロード結果
 */
export const uploadGLBFiles = async (
    assets: Asset[],
    onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
    const glbAssets = assets.filter(asset => asset.fileType === 'glb');

    if (glbAssets.length === 0) {
        return {
            success: false,
            message: 'No GLB files found to upload'
        };
    }

    const uploadedFiles: string[] = [];
    const errors: string[] = [];

    // デモ用：実際のアップロードの代わりにダウンロード機能を提供
    try {
        for (let i = 0; i < glbAssets.length; i++) {
            const asset = glbAssets[i];

            // 進捗を報告
            onProgress?.({
                totalFiles: glbAssets.length,
                currentFile: i + 1,
                fileName: asset.fileName,
                progress: ((i + 1) / glbAssets.length) * 100
            });

            try {
                // fileUrlからファイルを取得
                const response = await fetch(asset.fileUrl);
                const blob = await response.blob();

                // ダウンロードリンクを作成
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = asset.fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                uploadedFiles.push(asset.fileName);
                console.log(`Successfully downloaded: ${asset.fileName}`);

                // デモ用の遅延（実際のアップロードをシミュレート）
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                errors.push(`${asset.fileName}: ${errorMessage}`);
                console.error(`Error downloading ${asset.fileName}:`, error);
            }
        }

        return {
            success: true,
            message: `Successfully downloaded ${uploadedFiles.length} GLB files`,
            uploadedFiles
        };
    } catch (error) {
        return {
            success: false,
            message: 'Failed to process files',
            errors: [error instanceof Error ? error.message : 'Unknown error']
        };
    }
};

/**
 * 実際のサーバーにアップロードする関数（APIが利用可能な場合）
 * @param assets アップロードするアセットの配列
 * @param onProgress 進捗コールバック
 * @param uploadUrl アップロード先URL
 * @returns アップロード結果
 */
export const uploadGLBFilesToServer = async (
    assets: Asset[],
    onProgress?: (progress: UploadProgress) => void,
    uploadUrl: string = '/api/upload-glb'
): Promise<UploadResult> => {
    const glbAssets = assets.filter(asset => asset.fileType === 'glb');

    if (glbAssets.length === 0) {
        return {
            success: false,
            message: 'No GLB files found to upload'
        };
    }

    const uploadedFiles: string[] = [];
    const errors: string[] = [];

    for (let i = 0; i < glbAssets.length; i++) {
        const asset = glbAssets[i];

        // 進捗を報告
        onProgress?.({
            totalFiles: glbAssets.length,
            currentFile: i + 1,
            fileName: asset.fileName,
            progress: ((i + 1) / glbAssets.length) * 100
        });

        try {
            // fileUrlからファイルを取得
            const response = await fetch(asset.fileUrl);
            const blob = await response.blob();

            // FormDataを作成
            const formData = new FormData();
            formData.append('file', blob, asset.fileName);
            formData.append('assetId', asset.id);
            formData.append('assetName', asset.name);

            const uploadResponse = await fetch(uploadUrl, {
                method: 'POST',
                body: formData
            });

            if (uploadResponse.ok) {
                const result = await uploadResponse.json();
                uploadedFiles.push(asset.fileName);
                console.log(`Successfully uploaded: ${asset.fileName}`, result);
            } else {
                const errorText = await uploadResponse.text();
                errors.push(`${asset.fileName}: ${errorText}`);
                console.error(`Failed to upload ${asset.fileName}:`, errorText);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            errors.push(`${asset.fileName}: ${errorMessage}`);
            console.error(`Error uploading ${asset.fileName}:`, error);
        }
    }

    // 結果を返す
    if (errors.length === 0) {
        return {
            success: true,
            message: `Successfully uploaded ${uploadedFiles.length} GLB files`,
            uploadedFiles
        };
    } else if (uploadedFiles.length > 0) {
        return {
            success: true,
            message: `Uploaded ${uploadedFiles.length} files with ${errors.length} errors`,
            uploadedFiles,
            errors
        };
    } else {
        return {
            success: false,
            message: `Failed to upload any files. ${errors.length} errors occurred`,
            errors
        };
    }
};

/**
 * ダウンロード用のZIPファイルを作成する関数（代替案）
 * @param assets ダウンロードするアセットの配列
 */
export const downloadGLBFilesAsZip = async (assets: Asset[]): Promise<void> => {
    const glbAssets = assets.filter(asset => asset.fileType === 'glb');

    if (glbAssets.length === 0) {
        alert('No GLB files found to download');
        return;
    }

    try {
        // JSZipライブラリを使用する場合（package.jsonに追加が必要）
        // import JSZip from 'jszip';
        // const zip = new JSZip();

        // 各ファイルをZIPに追加
        for (const asset of glbAssets) {
            const response = await fetch(asset.fileUrl);
            const blob = await response.blob();
            // zip.file(asset.fileName, blob);
        }

        // ZIPファイルをダウンロード
        // const zipBlob = await zip.generateAsync({ type: 'blob' });
        // const url = URL.createObjectURL(zipBlob);
        // const a = document.createElement('a');
        // a.href = url;
        // a.download = 'glb-files.zip';
        // a.click();
        // URL.revokeObjectURL(url);

        console.log('ZIP download functionality would be implemented here');
        alert('ZIP download functionality not yet implemented');
    } catch (error) {
        console.error('Error creating ZIP file:', error);
        alert('Failed to create ZIP file');
    }
}; 