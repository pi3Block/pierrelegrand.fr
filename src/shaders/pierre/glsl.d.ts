/**
 * Déclarations TypeScript pour les fichiers GLSL.
 * Permet d'importer les shaders comme des modules.
 */

declare module '*.glsl' {
  const value: string
  export default value
}

declare module '*.vert' {
  const value: string
  export default value
}

declare module '*.frag' {
  const value: string
  export default value
}

