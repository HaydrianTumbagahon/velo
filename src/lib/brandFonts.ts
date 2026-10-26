export async function loadBrandFont(name: string): Promise<string> {
  switch (name) {
    case 'Newsreader':
      await Promise.all([
        import('@fontsource-variable/newsreader/wght.css'),
        import('@fontsource-variable/newsreader/wght-italic.css'),
      ])
      return 'Newsreader Variable'
    case 'JetBrains Mono':
      await import('@fontsource-variable/jetbrains-mono')
      return 'JetBrains Mono Variable'
    case 'Archivo':
      await import('@fontsource-variable/archivo/wdth.css')
      return 'Archivo Variable'
    case 'Hanken Grotesk':
      return 'Hanken Grotesk Variable'
    default:
      return 'Hanken Grotesk Variable'
  }
}
