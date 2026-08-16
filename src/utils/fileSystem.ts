import { get, set } from 'idb-keyval';

const DIRECTORY_HANDLE_KEY = 'aiventura_local_dir_handle';

export const requestLocalDirectory = async (): Promise<boolean> => {
    try {
        if (!('showDirectoryPicker' in window)) {
            console.warn('File System Access API não é suportada neste navegador.');
            return false;
        }

        const dirHandle = await (window as any).showDirectoryPicker({
            mode: 'readwrite'
        });

        if (dirHandle) {
            await set(DIRECTORY_HANDLE_KEY, dirHandle);
            return true;
        }
        return false;
    } catch (e) {
        console.error('Erro ao pedir diretoria:', e);
        return false;
    }
};

export const verifyDirectoryPermission = async (): Promise<any | null> => {
    try {
        const handle = await get(DIRECTORY_HANDLE_KEY);
        if (!handle) return null;

        const options = { mode: 'readwrite' };
        if ((await handle.queryPermission(options)) === 'granted') {
            return handle;
        }

        if ((await handle.requestPermission(options)) === 'granted') {
            return handle;
        }
        return null;
    } catch (e) {
        return null;
    }
};

export const saveStoryToJson = async (storyId: string, storyData: any) => {
    try {
        const handle = await verifyDirectoryPermission();
        if (!handle) return false;

        // Formatar o nome do ficheiro, ex: aiventura_obra_123.json
        const safeTitle = storyData.title ? storyData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : storyId;
        const filename = `aiventura_${safeTitle}.json`;
        const fileHandle = await handle.getFileHandle(filename, { create: true });
        
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(storyData, null, 2));
        await writable.close();
        
        return true;
    } catch (e) {
        console.error('Erro ao gravar no file system:', e);
        return false;
    }
};
