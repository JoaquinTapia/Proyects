import { fetchRemotive } from "./remotive";
import { fetchArbeitnow } from "./arbeitnow";
import { fetchJobicy } from "./jobicy";
import { fetchHimalayas } from "./himalayas";
import { fetchAdzuna } from "./adzuna";
import { fetchExtension } from "./extension";

// Agregar una fuente nueva es agregar un archivo fetcher + una línea acá.
export const SOURCES = [
  fetchRemotive,
  fetchArbeitnow,
  fetchJobicy,
  fetchHimalayas,
  fetchAdzuna,
  fetchExtension,
];
