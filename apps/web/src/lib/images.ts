export function readImageFile(file: File): Promise<{ dataBase64: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve({ dataBase64: String(reader.result ?? ''), mime: file.type })
    }
    reader.onerror = () => reject(reader.error ?? new Error('read failed'))
    reader.readAsDataURL(file)
  })
}
