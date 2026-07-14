export class PlayerDataService {
  constructor({ endpoint = "./players.json" } = {}) {
    this.endpoint = endpoint;
  }

  async getPlayers() {
    const response = await fetch(this.endpoint, { cache: "no-store" });
    if (!response.ok) throw new Error(`Player API returned ${response.status}`);
    return response.json();
  }
}

// Later, change endpoint to something like:
// new PlayerDataService({ endpoint: "https://your-api.com/api/nba/teams/WAS/players" });
