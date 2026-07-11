const TAMANOS = [
  { id: "pequeno", nombre: "Pequeño", descripcion: "Hasta 10 kg (poodle toy, yorkshire, shih tzu…)" },
  { id: "mediano", nombre: "Mediano", descripcion: "10 a 25 kg (cocker, schnauzer, beagle…)" },
  { id: "grande", nombre: "Grande", descripcion: "Más de 25 kg (golden, labrador, ovejero…)" }
];
const DURACION_SERVICIO_MIN = 120;
const SERVICIOS = [
  {
    id: "bano",
    nombre: "Baño completo",
    descripcion: "Baño con shampoo hipoalergénico, secado y cepillado.",
    incluye: ["Shampoo según tipo de pelo", "Secado y cepillado", "Limpieza de oídos", "Corte de uñas", "Perfume"],
    precioPorTamano: { pequeno: 12e3, mediano: 16e3, grande: 22e3 },
    calcomSlug: "bano"
  },
  {
    id: "bano-corte",
    nombre: "Baño + corte",
    descripcion: "Baño completo más corte de pelo a tijera o máquina, según la raza y tu gusto.",
    incluye: ["Todo lo del baño completo", "Corte según raza o a pedido", "Higiénico (patitas, carita, zona sanitaria)"],
    precioPorTamano: { pequeno: 18e3, mediano: 24e3, grande: 32e3 },
    calcomSlug: "bano-y-corte"
  },
  {
    id: "stripping",
    nombre: "Stripping",
    descripcion: "Retiro manual del pelo muerto para razas de pelo duro (schnauzer, fox terrier, westy…). Mantiene la textura y el color del manto.",
    incluye: ["Stripping manual completo", "Baño posterior", "Cepillado y perfume"],
    precioPorTamano: { pequeno: 25e3, mediano: 32e3, grande: 4e4 },
    calcomSlug: "stripping"
  },
  {
    id: "deslanado",
    nombre: "Deslanado",
    descripcion: "Retiro del subpelo muerto en razas de doble manto (golden, ovejero, husky…). Ideal en cambio de estación.",
    incluye: ["Baño con acondicionador", "Deslanado con herramientas específicas", "Secado profundo"],
    precioPorTamano: { pequeno: 18e3, mediano: 25e3, grande: 35e3 },
    calcomSlug: "deslanado"
  }
];
const SERVICIOS_EXPRESS = [
  { id: "orejas", nombre: "Limpieza de orejitas", duracionMin: 5 },
  { id: "glandulas", nombre: "Vaciado glandular", duracionMin: 5 },
  { id: "unas", nombre: "Corte y limado de uñas", duracionMin: 5 }
];
const POLITICAS_RESERVA = {
  anticipacionMinimaHoras: 24,
  ultimaHoraInicio: "17:30",
  notaHorarioEspecial: "Si ningún horario te acomoda, escríbenos por WhatsApp: los horarios especiales son conversables (también con 24 h de anticipación)."
};
function getServicio(id) {
  return SERVICIOS.find((s) => s.id === id);
}
function getTamano(id) {
  return TAMANOS.find((t) => t.id === id);
}

export { DURACION_SERVICIO_MIN as D, POLITICAS_RESERVA as P, SERVICIOS as S, TAMANOS as T, getTamano as a, SERVICIOS_EXPRESS as b, getServicio as g };
