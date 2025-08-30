import { Component } from "@blitz-ts/Component";
import { getApiUrl } from "../../config/api";

interface ViewMatchProps {
  nickname?: string;
}

interface ViewMatchState {
  friends: Array<{ userId: number; nickname: string }>;
  loading: boolean;
  error: string | null;
}

export class ViewMatchComponent extends Component<ViewMatchProps, ViewMatchState> {
  protected static state: ViewMatchState = {
    friends: [],
    loading: false,
    error: null,
  };

  constructor(props?: ViewMatchProps) {
    super(props || {});
  }

  protected async onMount(): Promise<void> {
    await this.loadFriendsOfViewedUser();
  }

  render(): void {
    // no-op, we manipulate DOM directly after fetch
  }

  private async loadFriendsOfViewedUser(): Promise<void> {
    const nickname = (this.getProps().nickname || '').trim();
    if (!nickname) {
      this.setState({ error: 'No nickname', loading: false });
      this.renderFriends();
      return;
    }
    this.setState({ loading: true, error: null });
    try {
      // 1) resolve profile by nickname
      const profilesResp = await fetch(getApiUrl('/profiles'), { credentials: 'include' });
      if (!profilesResp.ok) throw new Error('Failed to load profiles');
      const profiles = await profilesResp.json();
      const profile = Array.isArray(profiles)
        ? profiles.find((p: any) => (p?.nickname || '').trim() === nickname)
        : null;
      if (!profile || !profile.userId) throw new Error('Profile not found');

      // 2) fetch friendships for that userId
      const friendsResp = await fetch(getApiUrl(`/friend/${profile.userId}`), { credentials: 'include' });
      let friendships: any[] = [];
      if (friendsResp.ok) {
        friendships = await friendsResp.json();
      } else if (friendsResp.status === 400 || friendsResp.status === 404) {
        friendships = [];
      } else if (friendsResp.status === 401) {
        this.setState({ error: 'log in to see their friends:)', loading: false });
        this.renderFriends();
        return;
      } else {
        throw new Error('Failed to load friendships');
      }

      // friendships likely contain userId1/userId2; map to nicknames
      const friendIds: number[] = [];
      if (Array.isArray(friendships)) {
        for (const f of friendships) {
          const initiator = Number(f.initiator_id ?? f.initiatorId);
          const recipient = Number(f.recipient_id ?? f.recipientId);
          if (!Number.isNaN(initiator) && initiator !== profile.userId) friendIds.push(initiator);
          if (!Number.isNaN(recipient) && recipient !== profile.userId) friendIds.push(recipient);
        }
      }
      const uniqueIds = Array.from(new Set(friendIds));

      // 3) resolve nicknames for each friend id
      const results: Array<{ userId: number; nickname: string }> = [];
      for (const id of uniqueIds) {
        try {
          const pr = await fetch(getApiUrl(`/profiles/user/${id}`), { credentials: 'include' });
          if (pr.ok) {
            const p = await pr.json();
            results.push({ userId: id, nickname: (p?.nickname || `User${id}`) as string });
          }
        } catch {}
      }

      this.setState({ friends: results, loading: false, error: null });
      this.renderFriends();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load friends';
      this.setState({ error: msg, loading: false });
      this.renderFriends();
    }
  }

  private renderFriends(): void {
    const container = this.getElement();
    if (!container) return;
    const { loading, error, friends } = this.state as ViewMatchState;

    if (loading) {
      container.innerHTML = `
        <div id="view-friends" class="flex flex-col items-start justify-start h-[500px] lg:h-[600px] w-full relative bg-[#F0F7F7]">
          <div id="view-friend-list" class="flex flex-col items-start justify-start h-full w-full overflow-y-auto">
            <div class="text-[#81C3C3] font-['Irish_Grover'] px-[5%] py-4">Loading friends...</div>
          </div>
        </div>
      `;
      return;
    }

    if (error) {
      container.innerHTML = `
        <div id="view-friends" class="flex flex-col items-start justify-start h-[500px] lg:h-[600px] w-full relative bg-[#F0F7F7]">
          <div id="view-friend-list" class="flex flex-col items-start justify-start h-full w-full overflow-y-auto">
            <div class="text-red-400 font-['Irish_Grover'] px-[5%] py-4">${error}</div>
          </div>
        </div>
      `;
      return;
    }

    if (!friends.length) {
      container.innerHTML = `
        <div id="view-friends" class="flex flex-col items-start justify-start h-[500px] lg:h-[600px] w-full relative bg-[#F0F7F7]">
          <div id="view-friend-list" class="flex flex-col items-start justify-start h-full w-full overflow-y-auto">
            <div class="text-[#81C3C3] font-['Irish_Grover'] px-[5%] py-4">No friends found.</div>
          </div>
        </div>
      `;
      return;
    }

    const rows = friends.map((f) => {
      const href = `/view/${encodeURIComponent(f.nickname)}`;
      return `
        <div class="flex flex-row items-center justify-between w-[90%] h-[40px] border-b border-[#C3E3E3] py-2 mx-[5%]">
          <a href="${href}" class="text-[#81C3C3] font-['Irish_Grover'] hover:text-[#B784F2] transition-colors duration-300">${this.escapeHtml(f.nickname)}</a>
        </div>
      `;
    }).join('');
    container.innerHTML = `
      <div id="view-friends" class="flex flex-col items-start justify-start h-[500px] lg:h-[600px] w-full relative bg-[#F0F7F7]">
        <div id="view-friend-list" class="flex flex-col items-start justify-start h-full w-full overflow-y-auto">${rows}</div>
      </div>
    `;
  }

  private escapeHtml(input: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return String(input).replace(/[&<>"']/g, (m) => map[m]);
  }
}
