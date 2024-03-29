import axios from 'axios';
import { useToast } from 'vue-toastification';
import { getErrorMessage } from '@/utils/errors';
import type Organization from '@/models/Organization';
import type { Capability } from '@/models/types';

async function saveCapabilities(
  updatedOrganizationCapabilitiesMatrix: Array<Set<number>> | undefined,
  organizationCapabilities: Capability[],
  organization: Organization,
  admin = false,
) {
  const $toasted = useToast();

  if (!updatedOrganizationCapabilitiesMatrix) return;

  const capabilitiesToAdd = [];
  const capabilitiesToRemove = [];

  for (const org_capability of organizationCapabilities) {
    if (
      updatedOrganizationCapabilitiesMatrix[org_capability.phase] &&
      updatedOrganizationCapabilitiesMatrix[org_capability.phase].has(
        org_capability.capability,
      )
    ) {
      updatedOrganizationCapabilitiesMatrix[org_capability.phase].delete(
        org_capability.capability,
      );
    } else if (
      updatedOrganizationCapabilitiesMatrix[org_capability.phase].size > 0
    ) {
      capabilitiesToRemove.push(org_capability);
    }
  }

  for (const [phase, value] of Object.entries(
    updatedOrganizationCapabilitiesMatrix,
  )) {
    for (const capability of value) {
      capabilitiesToAdd.push({
        organization: organization.id,
        capability,
        phase,
      });
    }
  }

  if (capabilitiesToRemove.length > 0) {
    try {
      await Promise.all(
        capabilitiesToRemove.map(async (item) =>
          axios.delete(
            `${import.meta.env.VITE_APP_API_BASE_URL}/${
              admin ? 'admins/' : ''
            }organization_organizations_capabilities/${item.id}`,
          ),
        ),
      );
    } catch (error) {
      $toasted.error(getErrorMessage(error));
    }
  }

  if (capabilitiesToAdd.length > 0) {
    try {
      await Promise.all(
        capabilitiesToAdd.map(async (item) =>
          axios.post(
            `${import.meta.env.VITE_APP_API_BASE_URL}/${
              admin ? 'admins/' : ''
            }organization_organizations_capabilities`,
            item,
          ),
        ),
      );
    } catch (error) {
      $toasted.error(getErrorMessage(error));
    }
  }

  updatedOrganizationCapabilitiesMatrix = null;
}

export default function useCapabilities() {
  return { saveCapabilities };
}
