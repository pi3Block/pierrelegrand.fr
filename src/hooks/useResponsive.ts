/**
 * useResponsive - Hook pour détecter le type d'appareil et gérer le responsive.
 *
 * Fournit des informations sur la taille du viewport et le type d'appareil
 * pour adapter l'affichage des composants 3D (notamment les moniteurs uikit).
 */

import { useState, useEffect, useMemo } from 'react'

// Breakpoints
const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
}

export interface ResponsiveConfig {
  /** Largeur du viewport */
  width: number
  /** Hauteur du viewport */
  height: number
  /** Type d'appareil détecté */
  deviceType: 'mobile' | 'tablet' | 'desktop'
  /** Est-ce un appareil mobile ? */
  isMobile: boolean
  /** Est-ce une tablette ? */
  isTablet: boolean
  /** Est-ce un desktop ? */
  isDesktop: boolean
  /** Ratio de pixels de l'appareil */
  pixelRatio: number
  /** Est-ce un écran tactile ? */
  isTouchDevice: boolean
  /** Orientation (portrait/landscape) */
  orientation: 'portrait' | 'landscape'
}

/**
 * Configuration responsive pour les moniteurs 3D uikit.
 * Adapte pixelSize et dimensions selon l'appareil.
 */
export interface MonitorResponsiveConfig {
  /** Taille d'un pixel en unités 3D */
  pixelSize: number
  /** Facteur de scale global pour les UI */
  uiScale: number
  /** Largeur des fenêtres */
  windowWidth: number
  /** Hauteur des fenêtres */
  windowHeight: number
  /** Taille des icônes desktop */
  iconSize: number
  /** Taille de police de base */
  baseFontSize: number
}

/**
 * Hook principal pour la détection responsive.
 */
export function useResponsive(): ResponsiveConfig {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  })

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', handleResize)
    // Appel initial
    handleResize()

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const config = useMemo<ResponsiveConfig>(() => {
    const { width, height } = windowSize
    const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : 1

    // Détection du type d'appareil
    let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop'
    if (width < BREAKPOINTS.mobile) {
      deviceType = 'mobile'
    } else if (width < BREAKPOINTS.tablet) {
      deviceType = 'tablet'
    }

    // Détection tactile
    const isTouchDevice = typeof window !== 'undefined' && (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0
    )

    return {
      width,
      height,
      deviceType,
      isMobile: deviceType === 'mobile',
      isTablet: deviceType === 'tablet',
      isDesktop: deviceType === 'desktop',
      pixelRatio,
      isTouchDevice,
      orientation: width > height ? 'landscape' : 'portrait',
    }
  }, [windowSize])

  return config
}

/**
 * Hook pour obtenir la configuration responsive des moniteurs 3D.
 * Adapte automatiquement les tailles selon l'appareil.
 */
export function useMonitorResponsive(): MonitorResponsiveConfig {
  const { deviceType, isMobile, isTablet, pixelRatio } = useResponsive()

  return useMemo<MonitorResponsiveConfig>(() => {
    // Configuration de base (desktop)
    const basePixelSize = 0.00102

    // Facteurs de scale selon l'appareil
    // Sur mobile, on augmente le pixelSize pour que le contenu soit plus grand
    const scaleFactors = {
      mobile: 2.2,    // 2.2x plus grand sur mobile
      tablet: 1.5,    // 1.5x plus grand sur tablette
      desktop: 1.0,   // Taille normale sur desktop
    }

    const scaleFactor = scaleFactors[deviceType]

    // PixelSize adapté - plus grand sur mobile = UI plus grande
    const pixelSize = basePixelSize * scaleFactor

    // Dimensions des fenêtres adaptées
    const windowDimensions = {
      mobile: { width: 280, height: 320 },
      tablet: { width: 400, height: 350 },
      desktop: { width: 500, height: 400 },
    }

    // Taille des icônes
    const iconSizes = {
      mobile: 64,
      tablet: 72,
      desktop: 80,
    }

    // Taille de police de base
    const fontSizes = {
      mobile: 14,
      tablet: 12,
      desktop: 11,
    }

    return {
      pixelSize,
      uiScale: scaleFactor,
      windowWidth: windowDimensions[deviceType].width,
      windowHeight: windowDimensions[deviceType].height,
      iconSize: iconSizes[deviceType],
      baseFontSize: fontSizes[deviceType],
    }
  }, [deviceType, isMobile, isTablet, pixelRatio])
}

/**
 * Hook pour obtenir les positions de caméra adaptées au mobile.
 * Rapproche la caméra sur mobile pour une meilleure visibilité.
 */
export function useCameraResponsive() {
  const { isMobile, isTablet } = useResponsive()

  return useMemo(() => {
    // Facteur de zoom pour les moniteurs (plus proche sur mobile)
    const monitorZoomFactor = isMobile ? 0.7 : isTablet ? 0.85 : 1.0

    // Ajustement de la position par défaut
    const defaultPositionScale = isMobile ? 0.8 : isTablet ? 0.9 : 1.0

    return {
      monitorZoomFactor,
      defaultPositionScale,
      // Sur mobile, on peut vouloir un FOV différent
      fovAdjustment: isMobile ? 5 : 0,
    }
  }, [isMobile, isTablet])
}

export default useResponsive
