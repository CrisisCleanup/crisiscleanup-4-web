import type { CCUFileItem } from '@/models/types';

export interface IncidentAniAsset {
  id?: number;
  asset_type: string;
  language: number;
  content: string;
  ani: number;
  incident: number;
  visibility: string;
  published_at: string | null;
  created_at: string;
  files: CCUFileItem[];
  share_text_t: string;
}

export interface AssetTypeValue {
  key: string;
  value: string;
}

export interface VisibilityValue {
  key: string;
  value: string;
}

export interface GroupedAssets {
  [assetType: string]: IncidentAniAsset[];
}
