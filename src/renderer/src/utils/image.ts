// Reduz a foto antes de salvar, para o arquivo de dados não ficar pesado.
// Fica no máximo com 900 px de largura, em JPEG (uns 100 KB)
export async function resizeImage(file: File, maxWidth = 900): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxWidth / bitmap.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Não foi possível ler a imagem')
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.82)
}
