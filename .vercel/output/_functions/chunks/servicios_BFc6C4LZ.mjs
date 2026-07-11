const TAMANOS = [
  { id: "pequeno", nombre: "Pequeño", descripcion: "Hasta 10 kg (poodle toy, yorkshire, shih tzu…)" },
  { id: "mediano", nombre: "Mediano", descripcion: "10 a 25 kg (cocker, schnauzer, beagle…)" },
  { id: "grande", nombre: "Grande", descripcion: "Más de 25 kg (golden, labrador, ovejero…)" }
];
const SERVICIOS = [
  {
    id: "bano",
    nombre: "Baño completo",
    descripcion: "Baño con shampoo hipoalergénico, secado y cepillado.",
    incluye: ["Shampoo según tipo de pelo", "Secado y cepillado", "Limpieza de oídos", "Corte de uñas", "Perfume"],
    porTamano: {
      pequeno: { precio: 12e3, duracionMin: 45 },
      mediano: { precio: 16e3, duracionMin: 60 },
      grande: { precio: 22e3, duracionMin: 75 }
    },
    calcomSlug: "bano"
  },
  {
    id: "bano-corte",
    nombre: "Baño + corte",
    descripcion: "Baño completo más corte de pelo a tijera o máquina, según la raza y tu gusto.",
    incluye: ["Todo lo del baño completo", "Corte según raza o a pedido", "Higiénico (patitas, carita, zona sanitaria)"],
    porTamano: {
      pequeno: { precio: 18e3, duracionMin: 75 },
      mediano: { precio: 24e3, duracionMin: 90 },
      grande: { precio: 32e3, duracionMin: 120 }
    },
    calcomSlug: "bano-y-corte"
  },
  {
    id: "stripping",
    nombre: "Stripping",
    descripcion: "Retiro manual del pelo muerto para razas de pelo duro (schnauzer, fox terrier, westy…). Mantiene la textura y el color del manto.",
    incluye: ["Stripping manual completo", "Baño posterior", "Cepillado y perfume"],
    porTamano: {
      pequeno: { precio: 25e3, duracionMin: 90 },
      mediano: { precio: 32e3, duracionMin: 120 },
      grande: { precio: 4e4, duracionMin: 150 }
    },
    calcomSlug: "stripping"
  },
  {
    id: "deslanado",
    nombre: "Deslanado",
    descripcion: "Retiro del subpelo muerto en razas de doble manto (golden, ovejero, husky…). Ideal en cambio de estación.",
    incluye: ["Baño con acondicionador", "Deslanado con herramientas específicas", "Secado profundo"],
    porTamano: {
      pequeno: { precio: 18e3, duracionMin: 60 },
      mediano: { precio: 25e3, duracionMin: 90 },
      grande: { precio: 35e3, duracionMin: 120 }
    },
    calcomSlug: "deslanado"
  }
];
function getServicio(id) {
  return SERVICIOS.find((s) => s.id === id);
}
function getTamano(id) {
  return TAMANOS.find((t) => t.id === id);
}

export { SERVICIOS as S, TAMANOS as T, getTamano as a, getServicio as g };
