import { Project } from '../components/ProjectsTable'

export async function exportProjectToPDF(project: Project) {
  console.log('🚀 Iniciando exportación PDF para proyecto:', project?.name)
  
  try {
    if (!project) {
      console.error('❌ No hay proyecto seleccionado')
      alert('Error: No hay proyecto seleccionado')
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

    // Configuración para html2canvas - captura completa
    const canvas = await html2canvas(modalContent, {
      scale: 2, // Alta calidad
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

    console.log('📄 Creando documento PDF tamaño carta optimizado...')
    
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'letter') // Tamaño carta (letter)
    
    // Dimensiones de la página carta en mm
    const pageWidth = pdf.internal.pageSize.getWidth()  // ~215.9 mm
    const pageHeight = pdf.internal.pageSize.getHeight() // ~279.4 mm
    const margin = 5 // Margen mínimo de 5mm para aprovechar más espacio
    
    // Área útil para el contenido - maximizando el uso del espacio
    const contentWidth = pageWidth - (margin * 2)
    const contentHeight = pageHeight - (margin * 2)
    
    // Calcular dimensiones de la imagen
    const imgProps = pdf.getImageProperties(imgData)
    const imgWidth = imgProps.width
    const imgHeight = imgProps.height
    
    // Priorizar el ancho completo - usar todo el ancho disponible
    const widthRatio = contentWidth / imgWidth
    const heightRatio = contentHeight / imgHeight
    
    // Usar el ratio de ancho para maximizar el uso horizontal del espacio
    const ratio = widthRatio
    
    const finalWidth = contentWidth // Usar todo el ancho disponible
    const finalHeight = imgHeight * ratio
    
    console.log(`📏 Optimizando para máximo aprovechamiento del espacio:`)
    console.log(`   - Ancho página: ${pageWidth}mm, Alto: ${pageHeight}mm`)
    console.log(`   - Área contenido: ${contentWidth}mm x ${contentHeight}mm`)
    console.log(`   - Imagen final: ${finalWidth}mm x ${finalHeight}mm`)
    
    // Si la imagen ajustada cabe en una página
    if (finalHeight <= contentHeight) {
      // Usar todo el ancho, centrar verticalmente si es necesario
      const x = margin
      const y = margin + (contentHeight - finalHeight) / 2
      
      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight)
    } else {
      // Si es muy alta, dividir en múltiples páginas maximizando el ancho
      let currentPosition = 0
      let pageNumber = 1
      
      while (currentPosition < finalHeight) {
        if (pageNumber > 1) {
          pdf.addPage()
        }
        
        // Calcular qué parte de la imagen mostrar en esta página
        const remainingHeight = finalHeight - currentPosition
        const currentPageHeight = Math.min(contentHeight, remainingHeight)
        
        // Calcular la posición Y del clip
        const clipY = (currentPosition / finalHeight) * imgHeight
        const clipHeight = (currentPageHeight / finalHeight) * imgHeight
        
        // Crear un canvas temporal para esta sección
        const tempCanvas = document.createElement('canvas')
        const tempCtx = tempCanvas.getContext('2d')
        const img = new Image()
        
        await new Promise((resolve) => {
          img.onload = () => {
            tempCanvas.width = imgWidth
            tempCanvas.height = clipHeight
            
            tempCtx?.drawImage(
              img,
              0, clipY, imgWidth, clipHeight,  // source
              0, 0, imgWidth, clipHeight       // destination
            )
            
            const sectionData = tempCanvas.toDataURL('image/png')
            const sectionFinalHeight = clipHeight * ratio
            
            // Usar todo el ancho disponible en cada página
            pdf.addImage(
              sectionData, 
              'PNG', 
              margin,  // Comenzar desde el margen izquierdo
              margin,  // Comenzar desde el margen superior
              finalWidth,  // Usar todo el ancho disponible
              sectionFinalHeight
            )
            
            resolve(null)
          }
          img.src = imgData
        })
        
        currentPosition += currentPageHeight
        pageNumber++
      }
    }

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
    console.log('💾 Guardando archivo PDF tamaño carta...')
    
    pdf.save(fileName)
    console.log('✅ PDF generado exitosamente en tamaño carta')
    
  } catch (error) {
    console.error('❌ Error generando PDF:', error)
    console.error('❌ Stack trace:', (error as Error)?.stack)
    alert(`Error al generar el PDF: ${(error as Error)?.message || 'Error desconocido'}`)
  }
}
