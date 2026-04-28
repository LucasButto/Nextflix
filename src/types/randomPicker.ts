export interface PickerProvider {
  id: number;
  name: string;
  logo_path: string;
}

export interface RandomPickerItem {
  id: number;
  media_type: string;
  title: string;
  poster_path: string | null;
  vote_average: number;
  /** undefined = no provider data (My List sin fetch) */
  providers?: PickerProvider[];
  /** Mapa completo región → providers, solo en Top100 */
  providersByRegion?: Record<string, PickerProvider[]>;
}
