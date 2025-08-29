import { Project } from '../components/ProjectsTable'

interface PDFExportCallbacks {
  onCaptureStart?: () => void
  onGenerateStart?: () => void
  onDownloadStart?: () => void
  onComplete?: () => void
  onError?: () => void
}

export async function exportProjectToPDF(project: Project, callbacks?: PDFExportCallbacks) {
  console.log('🚀 Iniciando exportación PDF para proyecto:', project?.name)
  
  // Variables para manejar el modo oscuro - inicializar inmediatamente
  const htmlElement = document.documentElement
  const bodyElement = document.body
  let wasInDarkMode = false
  
  try {
    if (!project) {
      console.error('❌ No hay proyecto seleccionado')
      alert('Error: No hay proyecto seleccionado')
      callbacks?.onError?.()
      return
    }

    // Importación dinámica de las librerías
    console.log('📦 Importando librerías...')
    const { default: jsPDF } = await import('jspdf')
    const html2canvas = (await import('html2canvas')).default
    
    // Buscar el contenido del modal
    const modalContent = document.getElementById('project-modal-content') as HTMLElement
    if (!modalContent) {
      console.error('❌ No se encontró el contenido del modal')
      alert('Error: No se pudo encontrar el contenido del modal')
      return
    }

    console.log('📷 Preparando captura completa del modal...')
    
    // Llamar callback de inicio de captura
    callbacks?.onCaptureStart?.()
    
    // Detectar y guardar el estado del modo oscuro
    wasInDarkMode = htmlElement.classList.contains('dark') || bodyElement.classList.contains('dark')
    
    console.log(`🌙 Modo oscuro detectado: ${wasInDarkMode ? 'SÍ' : 'NO'}`)
    
    // Forzar modo claro temporalmente para la exportación
    if (wasInDarkMode) {
      console.log('☀️ Cambiando temporalmente a modo claro para exportación...')
      htmlElement.classList.remove('dark')
      bodyElement.classList.remove('dark')
      
      // Forzar también en el modal específico si tiene clases dark
      modalContent.classList.remove('dark')
      
      // Esperar un momento para que se apliquen los cambios de tema
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    // Guardar el estado original del scroll y overflow
    const originalOverflow = modalContent.style.overflow
    const originalMaxHeight = modalContent.style.maxHeight
    const scrollContainer = modalContent.querySelector('[class*="overflow-y-auto"]') as HTMLElement
    const originalScrollOverflow = scrollContainer?.style.overflow
    const originalScrollMaxHeight = scrollContainer?.style.maxHeight
    
    // Temporalmente mostrar todo el contenido sin scroll
    modalContent.style.overflow = 'visible'
    modalContent.style.maxHeight = 'none'
    if (scrollContainer) {
      scrollContainer.style.overflow = 'visible'
      scrollContainer.style.maxHeight = 'none'
    }
    
    // Esperar un momento para que se renderice
    await new Promise(resolve => setTimeout(resolve, 100))

    // Configuración para html2canvas - captura completa de alta resolución
    const canvas = await html2canvas(modalContent, {
      scale: 3, // Resolución muy alta para PDFs nítidos
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: modalContent.scrollWidth,
      height: modalContent.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      ignoreElements: (element) => {
        // Ignorar elementos de scroll para una captura limpia
        return element.classList.contains('scrollbar') || 
               element.classList.contains('webkit-scrollbar')
      }
    })

    // Restaurar el estado original
    modalContent.style.overflow = originalOverflow
    modalContent.style.maxHeight = originalMaxHeight
    if (scrollContainer) {
      scrollContainer.style.overflow = originalScrollOverflow || 'auto'
      scrollContainer.style.maxHeight = originalScrollMaxHeight || ''
    }
    
    // Restaurar el modo oscuro si estaba activado
    if (wasInDarkMode) {
      console.log('🌙 Restaurando modo oscuro original...')
      htmlElement.classList.add('dark')
      bodyElement.classList.add('dark')
    }

    console.log('📄 Creando documento PDF dinámico y alta resolución...')
    
    // Llamar callback de inicio de generación
    callbacks?.onGenerateStart?.()
    
    // Aumentar la resolución para mejor calidad (debe coincidir con el scale de html2canvas)
    const highResScale = 3 // Factor de escala para mejor resolución
    const imgData = canvas.toDataURL('image/png', 1.0) // Máxima calidad PNG
    
    // Crear un PDF temporal para obtener las propiedades de la imagen
    const tempPdf = new jsPDF()
    const imgProps = tempPdf.getImageProperties(imgData)
    
    // Calcular dimensiones optimizadas basadas en el contenido real
    const imgWidth = imgProps.width / highResScale // Ajustar por el factor de escala
    const imgHeight = imgProps.height / highResScale
    
    // Definir el ancho máximo deseado en mm (A4 width como referencia, pero sin limitarlo)
    const maxContentWidth = 200 // 200mm de ancho máximo para buena legibilidad
    const margin = 10 // Margen de 10mm
    
    // Calcular el ratio para mantener proporciones
    const widthRatio = maxContentWidth / imgWidth
    
    // Dimensiones finales del contenido
    const finalContentWidth = Math.min(imgWidth, maxContentWidth)
    const finalContentHeight = imgHeight * (finalContentWidth / imgWidth)
    
    // Dimensiones totales del documento (contenido + márgenes)
    const documentWidth = finalContentWidth + (margin * 2)
    const documentHeight = finalContentHeight + (margin * 2)
    
    console.log(`📏 Dimensiones dinámicas calculadas:`)
    console.log(`   - Contenido original: ${imgWidth}mm x ${imgHeight}mm`)
    console.log(`   - Contenido final: ${finalContentWidth}mm x ${finalContentHeight}mm`)
    console.log(`   - Documento total: ${documentWidth}mm x ${documentHeight}mm`)
    console.log(`   - Escala de resolución: ${highResScale}x`)
    
    // Crear el PDF con dimensiones personalizadas [ancho, alto]
    const pdf = new jsPDF({
      orientation: documentWidth > documentHeight ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [documentWidth, documentHeight] // Tamaño personalizado dinámico
    })
    
    // Agregar la imagen con las dimensiones calculadas
    pdf.addImage(
      imgData, 
      'PNG', 
      margin,  // x: margen izquierdo
      margin,  // y: margen superior  
      finalContentWidth,  // ancho del contenido
      finalContentHeight  // alto del contenido
    )

    // Generar nombre del archivo con valores reales
    const now = new Date()
    const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`
    
    // Limpiar el nombre del proyecto para el archivo
    const proyectoNombre = project.name
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remover caracteres especiales
      .replace(/\s+/g, '_') // Reemplazar espacios con guiones bajos
      .substring(0, 50) // Limitar longitud
    
    const fileName = `bpin-${project.bpin}-${proyectoNombre}-${timestamp}.pdf`
    
    console.log('📁 Nombre del archivo:', fileName)
    console.log('💾 Guardando archivo PDF dinámico...')
    
    // Callback antes de iniciar la descarga
    callbacks?.onDownloadStart?.()
    
    pdf.save(fileName)
    console.log('✅ PDF generado exitosamente con tamaño dinámico y alta resolución')
    
    // Callback al completar exitosamente
    callbacks?.onComplete?.()
    
  } catch (error) {
    console.error('❌ Error generando PDF:', error)
    console.error('❌ Stack trace:', (error as Error)?.stack)
    
    // Restaurar el modo oscuro en caso de error
    if (wasInDarkMode && htmlElement && bodyElement) {
      console.log('🌙 Restaurando modo oscuro debido a error...')
      htmlElement.classList.add('dark')
      bodyElement.classList.add('dark')
    }
    
    // Callback en caso de error
    callbacks?.onError?.()
    
    alert(`Error al generar el PDF: ${(error as Error)?.message || 'Error desconocido'}`)
  }
}
