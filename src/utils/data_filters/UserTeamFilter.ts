import Team from '../../models/Team';
import Filter from './Filter';
import { i18n } from '@/modules/i18n';

export default class UserTeamFilter extends Filter {
  packFunction() {
    const packed: Record<any, any> = {};
    const filteredTeams = Object.entries(this.data).filter(([key, value]) => {
      return Boolean(value) && !String(key).startsWith('no_team');
    });
    const noTeam = Object.entries(this.data).find(([key, value]) => {
      return Boolean(value) && String(key).startsWith('no_team');
    });
    if (filteredTeams.length > 0) {
      packed.team_ids = filteredTeams.map(([teamId]) => teamId).join(',');
    }
    if (noTeam && noTeam[1]) {
      packed.no_team_incident = String(noTeam[0]).split(':')[1];
    }

    return packed;
  }

  getCount() {
    const filteredTeams = Object.entries(this.data).filter(([, value]) => {
      return Boolean(value);
    });
    return filteredTeams.length;
  }

  getFilterLabels() {
    const labels: Record<string, unknown> = {};
    for (const [key] of Object.entries(this.data).filter(([, value]) => {
      return Boolean(value);
    })) {
      const { id, name } = Team.find(key)!;
      labels[id] = name;
    }

    const noTeam = Object.entries(this.data).find(([key, value]) => {
      return Boolean(value) && String(key).startsWith('no_team');
    });
    if (noTeam && noTeam[1]) {
      labels.no_team = i18n.global.t('~~No Team');
    }

    return labels;
  }

  removeField(identifier: string) {
    this.data[identifier] = false;
    this.data = { ...this.data };
  }
}
