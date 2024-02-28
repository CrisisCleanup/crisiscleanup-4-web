import type {
  GroupedAssets,
  IncidentAniAsset,
} from '@/components/admin/incidents/IncidentAssetBuilder.vue';
import type { AxiosResponse } from 'axios';
import axios from 'axios';

async function getAssets(incidentId: string): Promise<GroupedAssets> {
  const response: AxiosResponse<{ results: IncidentAniAsset[] }> =
    await axios.get(
      `${import.meta.env.VITE_APP_API_BASE_URL}/incident_assets`,
      {
        params: {
          incident: incidentId,
        },
      },
    );
  return groupAssets(response.data.results);
}

function groupAssets(assets: IncidentAniAsset[]) {
  const assetsByType = {} as GroupedAssets;

  // Group assets by their asset type
  for (const asset of assets) {
    const assetType: string = asset.asset_type;
    if (!assetsByType[assetType]) {
      assetsByType[assetType] = [];
    }
    assetsByType[assetType].push(asset);
  }

  return assetsByType;
}

export { getAssets };
