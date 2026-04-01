import { invoke } from '@tauri-apps/api/core'

export async function getImgBase64API(url) {
    const response = await invoke('get_img_base64', { url })
    console.log(response)
    return JSON.parse(response)
}