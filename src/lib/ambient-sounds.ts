export interface AmbientSound {
  id: string;
  label: string;
  url: string | null;
  icon: string;
}

// URLs CC0 do Pixabay. Quando uma URL ainda não foi confirmada,
// deixar `url: null` e marcar com TODO — o player desabilita o item.
export const AMBIENT_SOUNDS: AmbientSound[] = [
  {
    id: "rain",
    label: "Chuva",
    url: "https://cdn.pixabay.com/audio/2022/03/15/audio_de2c8e7ac6.mp3",
    icon: "CloudRain",
  },
  {
    id: "forest",
    label: "Floresta",
    url: "https://cdn.pixabay.com/audio/2022/02/14/audio_8caa3a1bff.mp3",
    icon: "Trees",
  },
  {
    id: "ocean",
    label: "Ondas do mar",
    url: "https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73467.mp3",
    icon: "Waves",
  },
  // TODO: confirmar URL CC0 e popular.
  { id: "cafe", label: "Café", url: null, icon: "Coffee" },
  // TODO: confirmar URL CC0 e popular.
  { id: "fire", label: "Lareira", url: null, icon: "Flame" },
  // TODO: confirmar URL CC0 e popular.
  { id: "wind", label: "Vento", url: null, icon: "Wind" },
  // TODO: confirmar URL CC0 e popular.
  { id: "lofi", label: "Lo-fi piano", url: null, icon: "Music" },
  {
    id: "white",
    label: "Ruído branco",
    url: "https://cdn.pixabay.com/audio/2024/02/29/audio_24c1c5b1e7.mp3",
    icon: "Radio",
  },
];
