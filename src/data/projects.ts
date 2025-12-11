import { CDN_URL } from '@/config';

const projects = [
  {
    slug: 'loyaresidence',
    title: 'RESIDENCIA LOYA',
    description:
      'Para el desarrollo del proyecto se consideró principalmente las necesidad del cliente en el ámbito topográfico, ambiental, visual, funcional y de accesibilidad. La vivienda proyecta de dos pisos, alberga dos mini departamentos con los siguientes espacios: sala - comedor, cocina, dos dormitorios, un baño y una zona de lavado, la accesibilidad a cada departamento está dado por unas gradas de conexión externas. A su vez se consideró al exterior tres espacios independientes destinados a parqueaderos, y en el costado lateral derecho una proyección de camino hacia los terrenos colindantes.',
    location: 'Quito, Ecuador',
    startDate: '2025-01-15',
    type: 'Residential',
    imageUrl: `${CDN_URL}/portfolio/loya-residence/home.webp`,
    images: [
      {
        url: `${CDN_URL}/portfolio/loya-residence/home.webp`,
        caption: 'Render principal de la residencia',
      },
      {
        url: `${CDN_URL}/portfolio/loya-residence/1-render-front.webp`,
        caption: 'Render frontal de la residencia',
      },
      {
        url: `${CDN_URL}/portfolio/loya-residence/1-render-back.webp`,
        caption: 'Render render posterior de la residencia',
      },
      {
        url: `${CDN_URL}/portfolio/loya-residence/1-render-lateral.webp`,
        caption: 'Render lateral de la residencia',
      },
      {
        url: `${CDN_URL}/portfolio/loya-residence/1-render-inside.webp`,
        caption: 'Render interior de la residencia',
      },
      {
        url: `${CDN_URL}/portfolio/loya-residence/1-description.webp`,
        caption: 'Descripcion general del proyecto',
      },
      {
        url: `${CDN_URL}/portfolio/loya-residence/2-concept.webp`,
        caption: 'Conceptualización del diseño arquitectónico (Area, Volumen)',
      },
      {
        url: `${CDN_URL}/portfolio/loya-residence/3-concept.webp`,
        caption:
          'Conceptualización del diseño arquitectónico (Dezplazamiento, Definición)',
      },
      {
        url: `${CDN_URL}/portfolio/loya-residence/4-concept.webp`,
        caption:
          'Conceptualización del diseño arquitectónico (Volumenes en planta alta y planta baja)',
      },
      {
        url: `${CDN_URL}/portfolio/loya-residence/5-implantation.webp`,
        caption: 'Implantación del proyecto en el terreno',
      },
      {
        url: `${CDN_URL}/portfolio/loya-residence/6-floors.webp`,
        caption: 'Plantas arquitectónicas del proyecto',
      },
      {
        url: `${CDN_URL}/portfolio/loya-residence/7-facade-front.webp`,
        caption: 'Elevación frontal del proyecto',
      },
      {
        url: `${CDN_URL}/portfolio/loya-residence/8-facade-side.webp`,
        caption: 'Elevación lateral izquierda del proyecto',
      },
      {
        url: `${CDN_URL}/portfolio/loya-residence/9-facade-side.webp`,
        caption: 'Elevación lateral derecha del proyecto',
      },
      {
        url: `${CDN_URL}/portfolio/loya-residence/10-section-cross.webp`,
        caption: 'Corte transversal del proyecto',
      },
      {
        url: `${CDN_URL}/portfolio/loya-residence/11-section-longitudinal.webp`,
        caption: 'Corte longitudinal del proyecto',
      },
      {
        url: `${CDN_URL}/portfolio/loya-residence/12-construction-detail.webp`,
        caption:
          'Detalle constructivo del proyecto (General, Losa colaborante)',
      },
      {
        url: `${CDN_URL}/portfolio/loya-residence/13-construction-detail.webp`,
        caption:
          'Detalle constructivo del proyecto (Columna-Viga, Anclaje-columna)',
      },
    ],
    url: '/portfolio/loyaresidence',
  },
];

export default projects;
